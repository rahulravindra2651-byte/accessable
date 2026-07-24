# PowerShell script to install dependencies and run both frontend and backend

# Set the project root path
$projectRoot = "c:\Users\R Rahul\Downloads\AccessAble-main\AccessAble-main\6P1\6P1\6P1\accessable"

# Backend setup
Write-Host "Installing backend dependencies..."
cd "$projectRoot\backend"
npm install

Write-Host "Starting backend server..."
Start-Job -ScriptBlock {
    cd "c:\Users\R Rahul\Downloads\AccessAble-main\AccessAble-main\6P1\6P1\6P1\accessable\backend"
    npm start
} | Out-Null

# Frontend setup
Write-Host "Installing frontend dependencies..."
cd "$projectRoot"
npm install

Write-Host "Starting frontend development server..."
npm start