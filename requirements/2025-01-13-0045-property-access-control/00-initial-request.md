# Initial Request

**Date:** 2025-01-13 00:45
**Requestor:** User
**Feature:** Property Access Control System Fix

## Original Request

okay great. another issue is that it seems that the property own user type cannot see the properties he/she has made. so can you fix it becasue there are three access rules. 1. tenants can only see the properties THEY are in an active contract with. 2. property owners can only see thier OWN properties that they have listed/added 3. property managers/admin can see ALL properties across the app and importantly they  can add properties on behalf of property owners (they need to sleect the own in the add property form, this funciton is only avaial;ble to the property managers only, property owners by default and can only add a property for themselves only)

## Problem Summary

The property access control system is not working correctly:
- Property owners cannot see properties they have created/listed
- Need to implement role-based property visibility rules
- Need to implement role-based property creation rules

## Expected Access Rules

1. **Tenants**: Can only see properties they are in an active contract with
2. **Property Owners**: Can only see their OWN properties that they have listed/added
3. **Property Managers/Admin**: Can see ALL properties across the app + can add properties on behalf of property owners (with owner selection in add form)

## Creation Rules

- **Property Owners**: Can only add properties for themselves (no owner selection)
- **Property Managers/Admin**: Can add properties for any owner (must select owner in form)