# Document-App Development Server Starter
Write-Host "Starting Document-App Development Servers..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend will start on http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend will start on http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop the servers" -ForegroundColor Red
Write-Host ""

# Start backend in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\1Coding_stuff\Document-App\backend'; npm start"

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start frontend in new terminal  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\1Coding_stuff\Document-App\frontend'; npm run dev"

Write-Host "Both servers are starting in separate terminals..." -ForegroundColor Green
Write-Host "You can now access the app at http://localhost:3000" -ForegroundColor Cyan
Read-Host "Press Enter to exit this launcher"
