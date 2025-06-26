const fetch = require('node-fetch');

async function testChatAPI() {
  try {
    // First login to get session cookie
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login status:', loginResponse.status);
    console.log('Cookies:', cookies);

    if (loginResponse.status === 200 && cookies) {
      // Test chat groups endpoint
      const groupsResponse = await fetch('http://localhost:5000/api/chat/groups', {
        headers: {
          'Cookie': cookies
        }
      });

      console.log('Groups API status:', groupsResponse.status);
      const groupsData = await groupsResponse.text();
      console.log('Groups response:', groupsData);

      // Test direct messages endpoint
      const directResponse = await fetch('http://localhost:5000/api/chat/direct/1/messages', {
        headers: {
          'Cookie': cookies
        }
      });

      console.log('Direct messages API status:', directResponse.status);
      const directData = await directResponse.text();
      console.log('Direct messages response:', directData);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testChatAPI();