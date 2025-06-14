# Real Estate Management App - Test Accounts

**Created:** December 2024  
**Purpose:** Testing different user roles and functionality  
**Total Accounts:** 14 (2 per role type)

---

## 🔐 Login Credentials

### ADMIN ACCOUNTS (System Administration)
| Name | Email | Phone | Password | Role | Location |
|------|-------|-------|----------|------|----------|
| أحمد الإدارة | admin1@realestatemg.com | +966501111001 | Admin123! | admin | الرياض |
| فاطمة النظام | admin2@realestatemg.com | +966501111002 | Admin123! | admin | الرياض |

**Permissions:** Full system access, user management, settings configuration

---

### MANAGER ACCOUNTS (Property Management)
| Name | Email | Phone | Password | Role | Location |
|------|-------|-------|----------|------|----------|
| محمد المدير | manager1@realestatemg.com | +966502222001 | Manager123! | manager | جدة |
| نورا الإشراف | manager2@realestatemg.com | +966502222002 | Manager123! | manager | جدة |

**Permissions:** Property oversight, tenant management, financial operations

---

### OWNER ACCOUNTS (Property Owners)
| Name | Email | Phone | Password | Role | Location |
|------|-------|-------|----------|------|----------|
| عبدالله الملكية | owner1@realestatemg.com | +966503333001 | Owner123! | owner | الرياض |
| مريم العقارات | owner2@realestatemg.com | +966503333002 | Owner123! | owner | جدة |

**Permissions:** View owned properties, rental income, tenant information

---

### TENANT ACCOUNTS (Property Renters)
| Name | Email | Phone | Password | Role | Location |
|------|-------|-------|----------|------|----------|
| خالد المستأجر | tenant1@realestatemg.com | +966504444001 | Tenant123! | tenant | الرياض |
| سارة السكن | tenant2@realestatemg.com | +966504444002 | Tenant123! | tenant | جدة |

**Permissions:** View lease details, submit maintenance requests, payment history

---

### BUYER ACCOUNTS (Potential Purchasers)
| Name | Email | Phone | Password | Role | Location |
|------|-------|-------|----------|------|----------|
| علي المشتري | buyer1@realestatemg.com | +966505555001 | Buyer123! | buyer | الرياض |
| هند الشراء | buyer2@realestatemg.com | +966505555002 | Buyer123! | buyer | جدة |

**Permissions:** Browse properties for sale, view property details, make inquiries

---

### EMPLOYEE ACCOUNTS (Staff Members)
| Name | Email | Phone | Password | Role | Location |
|------|-------|-------|----------|------|----------|
| يوسف الموظف | employee1@realestatemg.com | +966506666001 | Employee123! | employee | الرياض |
| ريم العمل | employee2@realestatemg.com | +966506666002 | Employee123! | employee | جدة |

**Permissions:** Daily operations, data entry, customer service

---

### CONTRACTOR ACCOUNTS (Maintenance & Services)
| Name | Email | Phone | Password | Role | Location |
|------|-------|-------|----------|------|----------|
| عمر المقاول | contractor1@realestatemg.com | +966507777001 | Contractor123! | contractor | الرياض |
| لينا الصيانة | contractor2@realestatemg.com | +966507777002 | Contractor123! | contractor | جدة |

**Permissions:** View assigned work orders, update maintenance status, submit reports

---

## 📱 Quick Reference

### Email Pattern
- **Admin:** admin1@realestatemg.com, admin2@realestatemg.com
- **Manager:** manager1@realestatemg.com, manager2@realestatemg.com
- **Owner:** owner1@realestatemg.com, owner2@realestatemg.com
- **Tenant:** tenant1@realestatemg.com, tenant2@realestatemg.com
- **Buyer:** buyer1@realestatemg.com, buyer2@realestatemg.com
- **Employee:** employee1@realestatemg.com, employee2@realestatemg.com
- **Contractor:** contractor1@realestatemg.com, contractor2@realestatemg.com

### Password Pattern
- **Format:** [Role]123!
- **Examples:** Admin123!, Manager123!, Owner123!, etc.

### Phone Number Pattern
- **Admin:** +96650111100X
- **Manager:** +96650222200X  
- **Owner:** +96650333300X
- **Tenant:** +96650444400X
- **Buyer:** +96650555500X
- **Employee:** +96650666600X
- **Contractor:** +96650777700X

---

## 🧪 Testing Scenarios

### Role-Based Testing
1. **Admin Testing:** Use admin accounts to test user management, system settings
2. **Manager Testing:** Use manager accounts to test property operations, reporting
3. **Owner Testing:** Use owner accounts to test property viewing, income tracking
4. **Tenant Testing:** Use tenant accounts to test maintenance requests, payments
5. **Buyer Testing:** Use buyer accounts to test property browsing, inquiries
6. **Employee Testing:** Use employee accounts to test daily operations workflow
7. **Contractor Testing:** Use contractor accounts to test work order management

### Geographic Testing
- **Riyadh Users:** admin1, owner1, tenant1, buyer1, employee1, contractor1
- **Jeddah Users:** manager1/2, owner2, tenant2, buyer2, employee2, contractor2

### Language & Localization Testing
- All accounts support Arabic interface testing
- RTL layout verification with Arabic names and addresses
- Saudi phone number format validation

---

## 🔒 Security Notes

- **Test Environment Only:** These credentials are for development/testing purposes
- **Default Passwords:** All accounts use predictable passwords for easy testing
- **Regular Rotation:** Update passwords periodically for security best practices
- **Production Migration:** Do not use these accounts in production environment

---

## 📊 Database Integration

### Account Creation Details
- **Database:** Supabase Project ID `fbabpaorcvatejkrelrf`
- **Table:** `profiles` 
- **Created:** December 2024
- **Status:** All accounts active and ready for testing
- **Nationality:** All Saudi nationals for localization testing
- **Profile Types:** Properly mapped to role permissions

### Testing Workflow
1. **Login Testing:** Verify authentication with each role type
2. **Permission Testing:** Confirm role-based access restrictions
3. **UI Testing:** Test Arabic interface with real user data
4. **Feature Testing:** Test role-specific functionality per account type

---

**Contact:** For questions about test accounts or additional testing scenarios, refer to the development team.

**Last Updated:** December 2024 