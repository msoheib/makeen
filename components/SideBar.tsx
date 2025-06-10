import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Users, Settings, BarChart2, Briefcase, FileText, UserPlus, Building, DollarSign, List, Edit, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';

const menuItems = [
    { title: 'Home', icon: Home, href: '/(drawer)/(tabs)/' },
    { 
        title: 'Owners and Customers', 
        icon: Users,
        subItems: [
            { title: 'Owner or Property Manager', href: '/(drawer)/(tabs)/people' },
            { title: 'Tenant', href: '/(drawer)/(tabs)/tenants' },
            { title: 'Buyer', href: '/not-created-yet' },
            { title: 'Foreign Tenants', href: '/not-created-yet' },
            { 
                title: 'Customers and suppliers', 
                subItems: [
                    { title: 'Client', href: '/not-created-yet' },
                    { title: 'Suplier', href: '/not-created-yet' },
                ]
            },
        ]
    },
    {
        title: 'Property Management',
        icon: Building,
        subItems: [
            { title: 'Properties List', href: '/(drawer)/(tabs)/properties' },
            { title: 'Rent a property', href: '/not-created-yet' },
            { title: 'Foreign Tenant Contracts', href: '/not-created-yet' },
            { title: 'List cash property', href: '/not-created-yet' },
            { title: 'List installment property', href: '/not-created-yet' },
            { title: 'Property Reservation List', href: '/not-created-yet' },
        ]
    },
    {
        title: 'Accounting & Voucher',
        icon: DollarSign,
        subItems: [
            { title: 'Receipt Voucher', href: '/not-created-yet' },
            { title: 'Payment Voucher', href: '/not-created-yet' },
            { title: 'Entry voucher', href: '/not-created-yet' },
            { title: 'Credit notification', href: '/not-created-yet' },
            { title: 'Debit notification', href: '/not-created-yet' },
            { title: 'VAT invoices', href: '/not-created-yet' },
        ]
    },
    {
        title: 'Reports',
        icon: BarChart2,
        subItems: [
             { title: 'Summary of Reports', href: '/(drawer)/(tabs)/reports' },
             { title: 'Invoices Report', href: '/not-created-yet' },
        ]
    },
    {
        title: 'Maintenance, letters, issues',
        icon: Briefcase,
        subItems: [
            { title: 'List Work Order Reports', href: '/(drawer)/(tabs)/maintenance' },
            { title: 'Add a maintenance report', href: '/not-created-yet' },
            { title: 'List Letters', href: '/not-created-yet' },
            { title: 'Add a Letter', href: '/not-created-yet' },
            { title: 'List Issues', href: '/not-created-yet' },
            { title: 'Add issue', href: '/not-created-yet' },
            { title: 'Archive documents', href: '/(drawer)/(tabs)/documents' },
        ]
    },
    {
        title: 'Settings',
        icon: Settings,
        href: '/(drawer)/(tabs)/settings'
    },
    {
        title: 'Users',
        icon: UserPlus,
        subItems: [
            { title: 'Add', href: '/not-created-yet' },
            { title: 'List', href: '/not-created-yet' },
            { title: 'User Transaction Report', href: '/not-created-yet' },
        ]
    }
];

const SubMenuItem = ({ item, level = 1 }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const navigation = useNavigation();
    const hasSubItems = item.subItems && item.subItems.length > 0;

    const handlePress = () => {
        if (hasSubItems) {
            setIsExpanded(!isExpanded);
        } else if (item.href) {
            // Close the drawer when navigating to a screen
            navigation.dispatch(DrawerActions.closeDrawer());
        }
    };
    
    const content = (
        <View style={[styles.menuItem, { paddingLeft: 10 + level * 15 }]}>
            {item.icon && <item.icon color="#333" size={20} />}
            <Text style={styles.menuItemText}>{item.title}</Text>
            {hasSubItems && (isExpanded ? <ChevronUp size={18} color="#333"/> : <ChevronDown size={18} color="#333"/>)}
        </View>
    );

    return (
        <View>
            {item.href ? (
                 <Link href={item.href} asChild>
                    <TouchableOpacity onPress={handlePress}>
                        {content}
                    </TouchableOpacity>
                </Link>
            ) : (
                <TouchableOpacity onPress={handlePress}>
                    {content}
                </TouchableOpacity>
            )}

            {isExpanded && hasSubItems && (
                <View>
                    {item.subItems.map((subItem, index) => (
                        <SubMenuItem key={index} item={subItem} level={level + 1} />
                    ))}
                </View>
            )}
        </View>
    );
};


const SideBar = () => {
    return (
        <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Real Estate MG</Text>
            </View>
            <ScrollView style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <SubMenuItem key={index} item={item} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor: '#fff',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    menuContainer: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 15,
        flex: 1,
        color: '#333',
    },
});

export default SideBar; 