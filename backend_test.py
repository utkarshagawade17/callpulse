#!/usr/bin/env python3
"""
Real-Time Contact Center Voice Analytics Dashboard - Backend API Test
Tests all backend endpoints with the provided session token.
"""

import requests
import sys
import json
from datetime import datetime

class ContactCenterAPITester:
    def __init__(self, base_url="https://contact-ai-hub-1.preview.emergentagent.com", session_token="test_session_1770446780227"):
        self.base_url = base_url
        self.session_token = session_token
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {self.session_token}'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result_data = response.json()
                    if isinstance(result_data, list):
                        print(f"   Response: List with {len(result_data)} items")
                    elif isinstance(result_data, dict):
                        if 'message' in result_data:
                            print(f"   Message: {result_data['message']}")
                        else:
                            print(f"   Response keys: {list(result_data.keys())}")
                except:
                    print(f"   Response: Non-JSON or empty")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            self.results.append({
                'test': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'url': url
            })

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            self.results.append({
                'test': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'error': str(e),
                'url': url
            })
            return False, {}

    def test_auth(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test /auth/me
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        if success and response:
            print(f"   User: {response.get('name', 'Unknown')} ({response.get('email', 'No email')})")
            return True
        return False

    def test_calls(self):
        """Test call-related endpoints"""
        print("\n📞 Testing Call Endpoints...")
        
        # Get active calls
        success1, calls = self.run_test("Get Active Calls", "GET", "calls/active", 200)
        call_id = None
        if success1 and calls:
            print(f"   Found {len(calls)} active calls")
            if calls:
                call_id = calls[0].get('call_id')
                print(f"   First call ID: {call_id}")

        # Get call history
        success2, history = self.run_test("Get Call History", "GET", "calls/history", 200)
        if success2 and history:
            print(f"   Found {len(history)} historical calls")

        # Test specific call detail if we have a call_id
        success3 = True
        if call_id:
            success3, call_detail = self.run_test("Get Call Detail", "GET", f"calls/{call_id}", 200)
            if success3:
                print(f"   Call detail loaded for {call_id}")

            # Test call transcript
            success4, transcript = self.run_test("Get Call Transcript", "GET", f"calls/{call_id}/transcript", 200)
            if success4:
                print(f"   Transcript has {len(transcript)} messages")

            # Test supervisor action
            action_data = {"action": "test_note", "details": "Test action from automated testing"}
            success5, action_result = self.run_test("Perform Supervisor Action", "POST", f"calls/{call_id}/action", 200, action_data)
            
            return success1 and success2 and success3 and success4 and success5
        
        return success1 and success2

    def test_alerts(self):
        """Test alert endpoints"""
        print("\n🚨 Testing Alert Endpoints...")
        
        # Get active alerts
        success1, alerts = self.run_test("Get Active Alerts", "GET", "alerts", 200)
        alert_id = None
        if success1 and alerts:
            print(f"   Found {len(alerts)} active alerts")
            if alerts:
                alert_id = alerts[0].get('alert_id')

        # Get alert history
        success2, history = self.run_test("Get Alert History", "GET", "alerts/history", 200)

        # Test alert actions if we have an alert
        if alert_id:
            # Test acknowledge
            success3, ack_result = self.run_test("Acknowledge Alert", "POST", f"alerts/{alert_id}/acknowledge", 200)
            
            # Test resolve
            success4, resolve_result = self.run_test("Resolve Alert", "POST", f"alerts/{alert_id}/resolve", 200)
            
            return success1 and success2 and success3 and success4
        
        return success1 and success2

    def test_agents(self):
        """Test agent endpoints"""
        print("\n👥 Testing Agent Endpoints...")
        
        # Get all agents
        success1, agents = self.run_test("Get All Agents", "GET", "agents", 200)
        agent_id = None
        if success1 and agents:
            print(f"   Found {len(agents)} agents")
            if agents:
                agent_id = agents[0].get('agent_id')
                print(f"   First agent: {agents[0].get('name', 'Unknown')} ({agent_id})")

        # Test specific agent detail
        success2 = True
        success3 = True
        if agent_id:
            success2, agent_detail = self.run_test("Get Agent Detail", "GET", f"agents/{agent_id}", 200)
            success3, agent_calls = self.run_test("Get Agent Calls", "GET", f"agents/{agent_id}/calls", 200)
        
        return success1 and success2 and success3

    def test_analytics(self):
        """Test analytics endpoints"""
        print("\n📊 Testing Analytics Endpoints...")
        
        # Real-time analytics
        success1, realtime = self.run_test("Get Realtime Analytics", "GET", "analytics/realtime", 200)
        if success1 and realtime:
            print(f"   Active calls: {realtime.get('active_calls', 0)}")
            print(f"   Avg sentiment: {realtime.get('avg_sentiment', 0)}")
            print(f"   Alert count: {realtime.get('alerts_count', 0)}")

        # Hourly analytics
        success2, hourly = self.run_test("Get Hourly Analytics", "GET", "analytics/hourly", 200)
        if success2 and hourly:
            print(f"   Hourly data points: {len(hourly)}")

        # Agent analytics
        success3, agents = self.run_test("Get Agent Analytics", "GET", "analytics/agents", 200)

        # Issue analytics
        success4, issues = self.run_test("Get Issue Analytics", "GET", "analytics/issues", 200)
        if success4 and issues:
            print(f"   Issue types found: {len(issues)}")

        # Export analytics
        success5, export = self.run_test("Export Analytics", "POST", "analytics/export", 200)
        if success5 and export:
            exported_count = export.get('count', 0)
            print(f"   Exported {exported_count} records")

        return success1 and success2 and success3 and success4 and success5

    def test_simulation(self):
        """Test simulation endpoints"""
        print("\n🎮 Testing Simulation Endpoints...")
        
        # Get simulation status
        success1, status = self.run_test("Get Simulation Status", "GET", "simulation/status", 200)
        if success1 and status:
            print(f"   Simulation running: {status.get('running', False)}")
            print(f"   Active calls: {status.get('active_calls', 0)}")

        # Update simulation config
        config_data = {"num_calls": 12, "issue_frequency": 0.15, "message_interval": 4}
        success2, config_result = self.run_test("Update Simulation Config", "POST", "simulation/config", 200, config_data)

        # Trigger event
        event_data = {"event_type": "angry_customer"}
        success3, event_result = self.run_test("Trigger Simulation Event", "POST", "simulation/trigger-event", 200, event_data)

        return success1 and success2 and success3

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary")
        print(f"================")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Print failed tests
        failed_tests = [r for r in self.results if not r['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['method']} {test['endpoint']} - Expected {test['expected_status']}, got {test['actual_status']}")
                if 'error' in test:
                    print(f"     Error: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    print("🚀 Real-Time Contact Center Voice Analytics Dashboard - Backend API Test")
    print("=" * 80)
    
    tester = ContactCenterAPITester()
    
    # Run all test suites
    try:
        auth_ok = tester.test_auth()
        if not auth_ok:
            print("\n❌ Authentication failed - stopping tests")
            return 1
        
        calls_ok = tester.test_calls()
        alerts_ok = tester.test_alerts()
        agents_ok = tester.test_agents()
        analytics_ok = tester.test_analytics()
        simulation_ok = tester.test_simulation()
        
        # Print summary
        all_passed = tester.print_summary()
        
        # Save results
        with open('/app/test_reports/backend_api_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_tests': tester.tests_run,
                    'passed_tests': tester.tests_passed,
                    'success_rate': round(tester.tests_passed/tester.tests_run*100, 1) if tester.tests_run > 0 else 0
                },
                'test_results': tester.results
            }, f, indent=2)
        
        return 0 if all_passed else 1
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())