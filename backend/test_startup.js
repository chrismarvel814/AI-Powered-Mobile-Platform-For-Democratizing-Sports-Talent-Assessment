try {
    const app = require('./server');
    console.log("Server loaded successfully, no syntax errors.");
} catch (e) {
    console.error("Syntax or Startup Error:", e);
}
