const http = require('http');

http.get('http://localhost:3000/api/admin/data?collection=temples', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    try {
      const temples = JSON.parse(data);
      const bharuch = temples.find(t => 
        t.name && (t.name.en === 'Bharuch' || t.name.mr === 'भरूच' || t.name.hi === 'भरूच')
      );
      console.log(JSON.stringify(bharuch, null, 2));
    } catch (e) {
      console.error("Parse error:", e);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
