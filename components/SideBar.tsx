import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Users, Settings, BarChart2, Briefcase, FileText, UserPlus, Building, DollarSign, List, Edit, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { NotificationBadge } from './NotificationBadge';
import { useTabBadgeCount } from '@/hooks/useNotificationBadges';
import { useTranslation } from '@/lib/useTranslation';
import { rtlStyles, rtlLayout } from '@/lib/theme';
import { isRTL } from '@/lib/rtl';

const SideBar = () => {
    const { t } = useTranslation('navigation');
    
    // Badge counts for different sections
    const tenantBadges = useTabBadgeCount('tenant');
    const propertyBadges = useTabBadgeCount('property');
    const maintenanceBadges = useTabBadgeCount('maintenance');
    const paymentBadges = useTabBadgeCount('payment');
    const totalBadges = useTabBadgeCount();

    const menuItems = [
        { title: t('home'), icon: Home, href: '/(drawer)/(tabs)/', badgeCount: totalBadges.count },
        { 
            title: t('ownersAndCustomers'), 
            icon: Users,
            badgeCount: tenantBadges.count,
            subItems: [
                { title: t('ownerOrPropertyManager'), href: '/(drawer)/(tabs)/people' },
                { title: t('tenant'), href: '/(drawer)/(tabs)/tenants', badgeCount: tenantBadges.count },
                { title: t('buyer'), href: '/not-created-yet' },
                { title: t('foreignTenants'), href: '/not-created-yet' },
                { 
                    title: t('customersAndSuppliers'), 
                    subItems: [
                        { title: t('client'), href: '/not-created-yet' },
                        { title: t('supplier'), href: '/not-created-yet' },
                    ]
                },
            ]
        },
        {
            title: t('propertyManagement'),
            icon: Building,
            badgeCount: propertyBadges.count + maintenanceBadges.count,
            subItems: [
                { title: t('propertiesList'), href: '/(drawer)/(tabs)/properties', badgeCount: propertyBadges.count },
                { title: t('rentProperty'), href: '/not-created-yet' },
                { title: t('foreignTenantContracts'), href: '/not-created-yet' },
                { title: t('listCashProperty'), href: '/not-created-yet' },
                { title: t('listInstallmentProperty'), href: '/not-created-yet' },
                { title: t('propertyReservationList'), href: '/not-created-yet' },
            ]
        },
        {
            title: t('accountingAndVoucher'),
            icon: DollarSign,
            badgeCount: paymentBadges.count,
            subItems: [
                { title: t('receiptVoucher'), href: '/not-created-yet' },
                { title: t('paymentVoucher'), href: '/not-created-yet' },
                { title: t('entryVoucher'), href: '/not-created-yet' },
                { title: t('creditNotification'), href: '/not-created-yet' },
                { title: t('debitNotification'), href: '/not-created-yet' },
                { title: t('vatInvoices'), href: '/not-created-yet' },
            ]
        },
        {
            title: t('reports'),
            icon: BarChart2,
            subItems: [
                 { title: t('summaryOfReports'), href: '/(drawer)/(tabs)/reports' },
                 { title: t('invoicesReport'), href: '/not-created-yet' },
            ]
        },
        {
            title: t('maintenanceLettersIssues'),
            icon: Briefcase,
            badgeCount: maintenanceBadges.count,
            subItems: [
                { title: t('maintenanceRequests'), href: '/maintenance', badgeCount: maintenanceBadges.count },
                { title: t('addMaintenanceReport'), href: '/maintenance/add' },
                { title: t('listLetters'), href: '/not-created-yet' },
                { title: t('addLetter'), href: '/not-created-yet' },
                { title: t('listIssues'), href: '/not-created-yet' },
                { title: t('addIssue'), href: '/not-created-yet' },
                { title: t('archiveDocuments'), href: '/(drawer)/(tabs)/documents' },
            ]
        },
        {
            title: t('settings'),
            icon: Settings,
            href: '/(drawer)/(tabs)/settings'
        },
        {
            title: t('users'),
            icon: UserPlus,
            subItems: [
                { title: t('add'), href: '/not-created-yet' },
                { title: t('list'), href: '/not-created-yet' },
                { title: t('userTransactionReport'), href: '/not-created-yet' },
            ]
        }
    ];

    const SubMenuItem = ({ item, level = 1 }) => {
        const [isExpanded, setIsExpanded] = React.useState(false);
        const navigation = useNavigation();
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const badgeCount = item.badgeCount || 0;

        const handlePress = () => {
            if (hasSubItems) {
                setIsExpanded(!isExpanded);
            } else if (item.href) {
                // Close the drawer when navigating to a screen
                navigation.dispatch(DrawerActions.closeDrawer());
            }
        };
        
        const content = (
            <View style={[styles.menuItem, rtlStyles.paddingStart(10 + level * 15)]}>
                {item.icon && <item.icon color="#333" size={20} />}
                <Text style={[styles.menuItemText, rtlStyles.textLeft]}>{item.title}</Text>
                {badgeCount > 0 && (
                    <NotificationBadge 
                        count={badgeCount} 
                        size="small" 
                        position="inline"
                    />
                )}
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

    return (
        <SafeAreaView 
            style={[styles.container, isRTL() && styles.rtlContainer]} 
            edges={['top', 'bottom']}
        >
            <View style={styles.header}>
                <Text style={[styles.headerText, rtlStyles.textLeft]}>{t('appTitle')}</Text>
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
        width: 280,
    },
    rtlContainer: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
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
        ...rtlStyles.row,
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    menuItemText: {
        fontSize: 16,
        ...rtlStyles.marginStart(15),
        flex: 1,
        color: '#333',
    },
});

export default SideBar; 