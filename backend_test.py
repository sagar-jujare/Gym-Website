import requests
import sys
from datetime import datetime
import json

class GymAPITester:
    def __init__(self, base_url="https://fitadmin-9.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
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
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_plans(self):
        """Test getting membership plans"""
        success, response = self.run_test("Get Plans", "GET", "plans", 200)
        if success and 'plans' in response:
            print(f"   Found {len(response['plans'])} plans")
        return success, response

    def test_get_trainers(self):
        """Test getting trainers"""
        success, response = self.run_test("Get Trainers", "GET", "trainers", 200)
        if success and 'trainers' in response:
            print(f"   Found {len(response['trainers'])} trainers")
        return success, response

    def test_contact_form(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "1234567890",
            "message": "Test message from API test"
        }
        return self.run_test("Contact Form", "POST", "contact/form", 200, contact_data)

    def test_admin_login(self, email="admin@ironandneon.com", password="admin123"):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_admin_me(self):
        """Test getting current admin info"""
        return self.run_test("Admin Me", "GET", "admin/me", 200)

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test("Dashboard Stats", "GET", "admin/dashboard", 200)
        if success:
            stats = ['total_members', 'active_members', 'monthly_revenue', 'upcoming_renewals']
            for stat in stats:
                if stat in response:
                    print(f"   {stat}: {response[stat]}")
        return success, response

    def test_get_members(self):
        """Test getting all members"""
        success, response = self.run_test("Get Members", "GET", "admin/members", 200)
        if success and 'members' in response:
            print(f"   Found {len(response['members'])} members")
        return success, response

    def test_create_member(self):
        """Test creating a new member"""
        member_data = {
            "full_name": "Test Member",
            "email": "testmember@example.com",
            "phone": "9876543210",
            "address": "Test Address",
            "membership_plan_id": "plan_monthly",
            "membership_start_date": datetime.now().isoformat(),
            "trainer_id": None
        }
        success, response = self.run_test("Create Member", "POST", "admin/members", 201, member_data)
        if success and 'member' in response:
            return success, response['member']['id']
        return success, None

    def test_get_payments(self):
        """Test getting all payments"""
        success, response = self.run_test("Get Payments", "GET", "admin/payments", 200)
        if success and 'payments' in response:
            print(f"   Found {len(response['payments'])} payments")
        return success, response

    def test_record_payment(self, member_id):
        """Test recording a manual payment"""
        if not member_id:
            print("⚠️  Skipping payment test - no member ID")
            return False, {}
        
        return self.run_test(
            "Record Payment", 
            "POST", 
            f"admin/payments/record?member_id={member_id}&amount=1999&payment_method=CASH", 
            200
        )

    def test_reports(self):
        """Test reports endpoints"""
        members_success, _ = self.run_test("Members Report", "GET", "admin/reports/members", 200)
        payments_success, _ = self.run_test("Payments Report", "GET", "admin/reports/payments", 200)
        return members_success and payments_success

def main():
    print("🏋️  Starting Iron & Neon Gym API Tests")
    print("=" * 50)
    
    tester = GymAPITester()
    
    # Test public endpoints first
    print("\n📋 Testing Public Endpoints...")
    tester.test_root_endpoint()
    tester.test_get_plans()
    tester.test_get_trainers()
    tester.test_contact_form()
    
    # Test admin authentication
    print("\n🔐 Testing Admin Authentication...")
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping admin tests")
        print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        return 1
    
    tester.test_admin_me()
    
    # Test admin endpoints
    print("\n📊 Testing Admin Dashboard...")
    tester.test_dashboard_stats()
    
    print("\n👥 Testing Member Management...")
    tester.test_get_members()
    member_success, member_id = tester.test_create_member()
    
    print("\n💳 Testing Payment Management...")
    tester.test_get_payments()
    if member_id:
        tester.test_record_payment(member_id)
    
    print("\n📈 Testing Reports...")
    tester.test_reports()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for test in tester.failed_tests:
            error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
            print(f"   - {test['name']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())