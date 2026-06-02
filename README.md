# Penny
Penny is an AI Financial Portfolio Assistant is an intelligent application designed to help users track, analyze, and optimize their investment portfolios using data-driven insights and artificial intelligence. The system provides personalized recommendations based on a user’s financial goals, risk tolerance, and market trends.

## Prerequisities 
- Python 3.14+ 
- Node.js 18.0+ 
- PostgreSQL 16

### Backend Setup

1. Create and activate a virtual environment:
   ```jsx
   cd app/backend
   python3 -m venv venv
   source venv/bin/activate        # Mac/Linux
   venv\Scripts\activate           # Windows
   ```

2. Create an .env in root, contact team admin for keys.

3. createdb penny_db 

4. uvicorn app.main:app --reload


The API runs at http://localhost:800 with interactive docs at /docs

### Frontend Setup 

1. Install the dependencies. CD into app/frontend and run: 
```jsx 
npm install 
``` 

2. Start the dev server with: 
```jsx 
npm run dev 
```

So the app would run at http://localhost:5173 

In pulling the project, make sure python(3) and pip are installed in the IDE. Then create a virtual environment with 
```jsx
python3 -m venv venv
```
Activate it by, 
```jsx
source venv/bin/activate
```
to deactivate, simply type 'deactivate'. 

Install in the virtual environment, 
```jsx 
pip install fastapi uvicorn 
```
Then install Vite and React 
```jsx 
npm create vite@latest 
``` 
With React and regular Javascript. 

### Backend Start
CD into the backend directory and activate the virtual environment. Then run this command: 
```jsx
uvicorn app.main:app --reload  
```

### Frontend Start
CD into the frontend directory and activate the virtual environment. Then run this command: 
```jsx 
npm run dev 
```