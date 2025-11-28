const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  try {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Logging in...');
    const loginRes = await post('/auth', { loggedUser: { id: 1, name: 'test' } });
    console.log('Login Status:', loginRes.status);
    if (loginRes.status !== 200) {
        console.error('Login Body:', loginRes.body);
        throw new Error('Login failed');
    }
    
    const { accessToken, refreshToken } = loginRes.body;
    console.log('Access Token:', accessToken ? 'Received' : 'Missing');
    console.log('Refresh Token:', refreshToken ? 'Received' : 'Missing');

    if (!refreshToken) throw new Error('No refresh token received');

    console.log('Refreshing token...');
    const refreshRes = await post('/auth/refresh', { refreshToken });
    console.log('Refresh Status:', refreshRes.status);
    if (refreshRes.status !== 200) throw new Error('Refresh failed: ' + JSON.stringify(refreshRes.body));

    const newAccessToken = refreshRes.body.accessToken;
    console.log('New Access Token:', newAccessToken ? 'Received' : 'Missing');
    
    if (!newAccessToken) throw new Error('No new access token received');
    
    console.log('Verification Successful');
  } catch (err) {
    console.error('Verification Failed:', err);
    process.exit(1);
  }
}

run();
