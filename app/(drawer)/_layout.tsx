import { Drawer } from 'expo-router/drawer';
import SideBar from '../../components/SideBar';

export default function DrawerLayout() {
  return (
    <Drawer id="main-drawer" drawerContent={(props) => <SideBar {...props} />}>
      <Drawer.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
    </Drawer>
  );
} 