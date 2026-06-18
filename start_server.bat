@echo off
:: Navigate to your project folder
cd /d "C:\Users\chris\Desktop\treeoflife"

:: Start the Node.js server in a new window
start "Node Server" cmd /k "node server.js"

:: Start ngrok (Replace 3000 with your actual port number)
start "Ngrok Tunnel" cmd /k "ngrok http 3000"