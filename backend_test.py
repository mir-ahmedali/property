import requests
import sys
import json
from datetime import datetime

class GolascoAPITester:
    def __init__(self, base_url="https://property-pulse-146.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

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
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_register_customer(self):
        """Test customer registration"""
        timestamp = int(datetime.now().timestamp())
        test_data = {
            "email": f"customer{timestamp}@test.com",
            "password": "testpass123",
            "full_name": f"Test Customer {timestamp}",
            "role": "customer"
        }
        
        success, response = self.run_test("Register Customer", "POST", "auth/register", 200, test_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            return True
        return False

    def test_login(self):
        """Test login with registered user"""
        if not self.user_data:
            return False
            
        # Test new UserLogin model - only email and password required
        login_data = {
            "email": self.user_data['email'],
            "password": "testpass123"
        }
        
        success, response = self.run_test("Login (UserLogin Model)", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_login_with_wrong_credentials(self):
        """Test login with wrong credentials"""
        if not self.user_data:
            return False
            
        # Test with wrong password
        login_data = {
            "email": self.user_data['email'],
            "password": "wrongpassword"
        }
        
        success, response = self.run_test("Login Wrong Password", "POST", "auth/login", 401, login_data)
        return success

    def test_login_with_nonexistent_email(self):
        """Test login with non-existent email"""
        login_data = {
            "email": "nonexistent@test.com",
            "password": "testpass123"
        }
        
        success, response = self.run_test("Login Non-existent Email", "POST", "auth/login", 401, login_data)
        return success

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

    def test_get_properties(self):
        """Test get properties list"""
        return self.run_test("Get Properties", "GET", "properties", 200)[0]

    def test_get_properties_with_filters(self):
        """Test get properties with filters"""
        success, _ = self.run_test("Get Properties with City Filter", "GET", "properties?city=Mumbai", 200)
        return success

    def test_create_lead_site_visit(self):
        """Test creating a site visit lead"""
        # First get a property to create lead for
        success, props_response = self.run_test("Get Properties for Lead", "GET", "properties", 200)
        if not success:
            return False
            
        # If no properties exist, create a lead with a dummy property ID to test the endpoint
        if not props_response:
            self.log_test("Create Site Visit Lead", False, "No properties available - need sample data")
            return False
            
        property_id = props_response[0]['id']
        
        lead_data = {
            "property_id": property_id,
            "type": "site_visit",
            "message": "Test site visit request"
        }
        
        return self.run_test("Create Site Visit Lead", "POST", "leads", 200, lead_data)[0]

    def test_customer_dashboard(self):
        """Test customer dashboard"""
        return self.run_test("Customer Dashboard", "GET", "dashboard/customer", 200)[0]

    def test_razorpay_create_order(self):
        """Test Razorpay order creation (may fail if keys not configured)"""
        # First get a property
        success, props_response = self.run_test("Get Properties for Booking", "GET", "properties", 200)
        if not success or not props_response:
            self.log_test("Razorpay Create Order", False, "No properties available for booking test")
            return False
            
        property_id = props_response[0]['id'] if props_response else "test-property-id"
        
        order_data = {
            "property_id": property_id,
            "amount": 50000.0
        }
        
        # This might fail if Razorpay keys are not configured
        success, response = self.run_test("Razorpay Create Order", "POST", "leads/booking/create-order", 200, order_data)
        
        # If it fails with 502, it's likely due to missing Razorpay keys
        if not success:
            # Try to get more details about the error
            url = f"{self.base_url}/api/leads/booking/create-order"
            headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {self.token}'}
            try:
                resp = requests.post(url, json=order_data, headers=headers, timeout=10)
                if resp.status_code == 502:
                    self.log_test("Razorpay Keys Check", False, "Razorpay keys not configured - expected for first implementation")
                    return False
            except:
                pass
        
        return success

    def test_agent_endpoints_unauthorized(self):
        """Test that customer cannot access agent endpoints"""
        success, _ = self.run_test("Agent Dashboard (Should Fail)", "GET", "dashboard/agent", 403)
        return success

    def test_franchise_endpoints_unauthorized(self):
        """Test that customer cannot access franchise endpoints"""
        success, _ = self.run_test("Franchise Dashboard (Should Fail)", "GET", "dashboard/franchise", 403)
        return success

def main():
    print("🚀 Starting Golasco Property API Tests")
    print("=" * 50)
    
    tester = GolascoAPITester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("Customer Registration", tester.test_register_customer),
        ("Login (UserLogin Model)", tester.test_login),
        ("Login Wrong Password", tester.test_login_with_wrong_credentials),
        ("Login Non-existent Email", tester.test_login_with_nonexistent_email),
        ("Get Current User", tester.test_get_me),
        ("Get Properties", tester.test_get_properties),
        ("Get Properties with Filters", tester.test_get_properties_with_filters),
        ("Create Site Visit Lead", tester.test_create_lead_site_visit),
        ("Customer Dashboard", tester.test_customer_dashboard),
        ("Razorpay Order Creation", tester.test_razorpay_create_order),
        ("Agent Dashboard (Unauthorized)", tester.test_agent_endpoints_unauthorized),
        ("Franchise Dashboard (Unauthorized)", tester.test_franchise_endpoints_unauthorized),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            tester.log_test(test_name, False, f"Exception: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())