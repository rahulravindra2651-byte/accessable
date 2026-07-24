import React, { useContext } from 'react';
import { AuthContext }  from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';

const AppShell = ({ children }) => {
  const { user } = useContext(AuthContext);
  const isImpaired = user?.role === 'impaired';

  return (
    <div className={isImpaired ? 'impaired-theme' : ''}>
      {children}
    </div>
  );
};

export default AppShell;
