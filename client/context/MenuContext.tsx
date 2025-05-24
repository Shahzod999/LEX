import { createContext, useContext, useState } from "react";

type MenuContextType = {
  menuVisible: boolean;
  showMenu: () => void;
  hideMenu: () => void;
  toggleMenu: () => void;
};

const MenuContext = createContext<MenuContextType>({
  menuVisible: false,
  showMenu: () => {},
  hideMenu: () => {},
  toggleMenu: () => {},
});

export const useMenu = () => useContext(MenuContext);

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const showMenu = () => setMenuVisible(true);
  const hideMenu = () => setMenuVisible(false);
  const toggleMenu = () => setMenuVisible(prev => !prev);

  return (
    <MenuContext.Provider
      value={{
        menuVisible,
        showMenu,
        hideMenu,
        toggleMenu,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}; 