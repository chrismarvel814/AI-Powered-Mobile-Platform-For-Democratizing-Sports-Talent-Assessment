# AI-POWERED MOBILE PLATFORM FOR DEMOCRATIZING SPORTS TALENT ASSESSMENT

This is the code repository for the application.

## 🚀 How to Run the Project for a Demo

Follow these steps to set up and run the project locally on your machine to show your sir.

### 1. Prerequisites
Before you begin, ensure you have **Node.js** installed on your computer. 
- If you don't have it, download and install it from [nodejs.org](https://nodejs.org/).
- This will also install `npm` (Node Package Manager), which is required to start the app.

### 2. Install Dependencies
Open your terminal (Command Prompt or PowerShell) and navigate to this project folder. Then run this command to install all the necessary packages for both the frontend and backend:

```bash
npm run install:all
```
*(This might take a minute or two to complete.)*

### 3. Start the Application
Once the installation is complete, you can start both the backend and frontend servers simultaneously by running:

```bash
npm run dev
```

### 4. View the Demo
- Look at your terminal output. The frontend should give you a local web address, usually: **`http://localhost:5173`**
- Open your web browser (Chrome, Edge, Safari, etc.) and paste that URL into the address bar.
- You can now interact with the "Sports Talent Assessment" platform and show the demo!

### 5. Testing the Analysis Endpoint
We have implemented a new sports performance analysis endpoint. To test it, your frontend or external clients can send a POST request:
**Endpoint**: `http://localhost:5000/api/analyze`
**Payload Example**:
```json
{
  "drillType": "vertical_jump",
  "motionTrackingData": [],
  "performanceMetrics": {
    "maxVelocity": 2.45,
    "time": 3.2
  },
  "biomechanicsAnalysis": {
    "formScore": 88
  },
  "duration": 3.2
}
```

### 🛑 Troubleshooting
If the terminal says `'npm' is not recognized`, it means Node.js is not installed correctly or you need to restart your computer/terminal after installing it.
