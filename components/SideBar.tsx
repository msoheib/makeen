import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Users, Settings, BarChart2, Briefcase, FileText, UserPlus, Building, DollarSign, List, Edit, ChevronDown, ChevronUp, Shield, User } from 'lucide-react-native';
import { DrawerActions } from '@react-navigation/native';
import { NotificationBadge } from './NotificationBadge';
import { useTabBadgeCount } from '@/hooks/useNotificationBadges';
import { useTranslation } from '@/lib/useTranslation';
import { rtlStyles, rtlLayout } from '@/lib/theme';
import { isRTL } from '@/lib/rtl';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useFilteredNavigation, getRoleDisplayName, SIDEBAR_PERMISSIONS } from '@/lib/permissions';

const SideBar = (props: DrawerContentComponentProps) => {
    const { navigation } = props;
    const router = useRouter();
    const { t } = useTranslation('navigation');
    
    // Get filtered navigation items based on user role
    const { sidebarItems, userContext, loading, hasNavigationAccess } = useFilteredNavigation();
    
    // Badge counts for different sections
    const tenantBadges = useTabBadgeCount('tenant');
    const propertyBadges = useTabBadgeCount('property');
    const maintenanceBadges = useTabBadgeCount('maintenance');
    const paymentBadges = useTabBadgeCount('payment');
    const totalBadges = useTabBadgeCount();

    // Navigation items are now loaded from useFilteredNavigation hook
    // which provides role-based filtering

    const SubMenuItem = ({ item, level = 1 }) => {
        const [isExpanded, setIsExpanded] = React.useState(false);
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const badgeCount = item.badgeCount || 0;

        const handlePress = () => {
            if (hasSubItems) {
                setIsExpanded(!isExpanded);
            } else if (item.href) {
                navigation.dispatch(DrawerActions.closeDrawer());
                router.push(item.href);
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
                <TouchableOpacity onPress={handlePress}>
                    {content}
                </TouchableOpacity>

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

    // Show loading while fetching user context
    if (loading) {
        return (
            <SafeAreaView 
                style={[styles.container, isRTL() && styles.rtlContainer]} 
                edges={['top', 'bottom']}
            >
                <View style={styles.header}>
                    <Text style={[styles.headerText, rtlStyles.textLeft]}>{t('appTitle')}</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0066CC" />
                    <Text style={styles.loadingText}>Loading user permissions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView 
            style={[styles.container, isRTL() && styles.rtlContainer]} 
            edges={['top', 'bottom']}
        >
            <View style={styles.header}>
                <Text style={[styles.headerText, rtlStyles.textLeft]}>{t('appTitle')}</Text>
                {userContext && (
                    <View style={styles.userInfo}>
                        <View style={styles.roleContainer}>
                            {userContext.role === 'admin' ? (
                                <Shield size={16} color="#0066CC" />
                            ) : (
                                <User size={16} color="#666" />
                            )}
                            <Text style={[styles.roleText, rtlStyles.textLeft]}>
                                {getRoleDisplayName(userContext.role)}
                            </Text>
                        </View>
                        {userContext.profile?.email && (
                            <Text style={[styles.emailText, rtlStyles.textLeft]}>
                                {userContext.profile.email}
                            </Text>
                        )}
                    </View>
                )}
            </View>
            <ScrollView style={styles.menuContainer}>
                {sidebarItems.map((item, index) => (
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
        marginBottom: 8,
    },
    userInfo: {
        marginTop: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0066CC',
        marginLeft: 6,
    },
    emailText: {
        fontSize: 12,
        color: '#666',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
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