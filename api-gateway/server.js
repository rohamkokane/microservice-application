const http = require('http');

const port = process.env.PORT || 3000;

const authService = new URL(
  process.env.AUTH_SERVICE_URL || 'http://localhost:4001'
);

const taskService = new URL(
  process.env.TASK_SERVICE_URL || 'http://localhost:4002'
);

const webOrigin =
  process.env.WEB_ORIGIN || 'http://localhost:3001';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': webOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods':
      'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function proxy(req, res, target, targetPath) {
  const headers = {
    ...req.headers,
    host: target.host
  };

  delete headers.origin;

  const upstream = http.request(
    {
      hostname: target.hostname,
      port: target.port || 80,
      method: req.method,
      path: targetPath,
      headers
    },
    (upstreamResponse) => {
      const responseHeaders = {
        ...upstreamResponse.headers
      };

      // Gateway is responsible for CORS
      delete responseHeaders['access-control-allow-origin'];
      delete responseHeaders['access-control-allow-credentials'];
      delete responseHeaders['access-control-allow-methods'];
      delete responseHeaders['access-control-allow-headers'];

      res.writeHead(
        upstreamResponse.statusCode || 502,
        {
          ...responseHeaders,
          ...corsHeaders()
        }
      );

      upstreamResponse.pipe(res);
    }
  );

  upstream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(503, {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders()
      });

      res.end(
        JSON.stringify({
          message: 'Upstream service is unavailable.'
        })
      );
    }
  });

  req.pipe(upstream);
}

http.createServer((req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host}`
  );

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  // Health check
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders()
    });

    return res.end(
      JSON.stringify({
        status: 'ok'
      })
    );
  }

  // Auth Service
  if (
    url.pathname === '/api/auth' ||
    url.pathname.startsWith('/api/auth/')
  ) {
    const targetPath =
      url.pathname.replace(/^\/api\/auth/, '/api') +
      url.search;

    return proxy(
      req,
      res,
      authService,
      targetPath
    );
  }

  // Task Service
  if (
    url.pathname === '/api/tasks' ||
    url.pathname.startsWith('/api/tasks/')
  ) {
    return proxy(
      req,
      res,
      taskService,
      url.pathname + url.search
    );
  }

  // Unknown route
  res.writeHead(404, {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders()
  });

  res.end(
    JSON.stringify({
      message: 'Gateway route not found.'
    })
  );

}).listen(port, () => {
  console.log(
    `API Gateway listening on http://localhost:${port}`
  );
});