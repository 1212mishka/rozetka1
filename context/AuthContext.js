// Подключаем необходимые инструменты из React:
// createContext — создаёт "контейнер" для данных, доступный всему приложению
// useContext   — позволяет "достать" эти данные в любом компоненте
// useState     — хранит переменные внутри компонента (с возможностью обновления)
// useEffect    — выполняет код после того, как компонент отрендерился (например, при запуске)
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading] = useState(false);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    global.accessToken = null;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
