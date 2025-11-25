import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { usePermissions } from '@/composables/usePermissions';
import { svgIcons } from '@/utils/svgIcons';

export const useSettingsConfig = () => {
    const router = useRouter();
    const { hasPermission, PERMISSIONS } = usePermissions();
    const { t, locale } = useI18n();
    
    const allNavItems = ref([
        {
            label: 'Settings',
            icon: 'pi pi-cog',
            items: [
                {
                    label: 'Company Profile',
                    icon: 'pi pi-building',
                    svgIcons: svgIcons.building,
                    requiredPermission: PERMISSIONS.SETTINGS_ACCESS,
                    command: () => router.push('/settings/company-profile')
                },
                // {
                //     label: 'Payroll Settings',
                //     icon: 'pi pi-money-bill',
                //     svgIcons: svgIcons.payroll,
                //     requiredPermission: PERMISSIONS.SETTINGS_ACCESS,
                //     command: () => router.push('/settings/payroll-settings')
                // },
                // {
                //     label: 'User Preferences',
                //     icon: 'pi pi-user',
                //     requiredPermission: PERMISSIONS.SETTINGS_ACCESS,
                //     command: () => router.push('/settings/user-preferences')
                // },
                // {
                //     label: 'System Settings',
                //     icon: 'pi pi-cog',
                //     requiredPermission: PERMISSIONS.SETTINGS_ACCESS,
                //     command: () => router.push('/settings/system-settings')
                // },
                // {
                //     label: 'Notifications',
                //     icon: 'pi pi-bell',
                //     requiredPermission: PERMISSIONS.SETTINGS_ACCESS,
                //     command: () => router.push('/settings/notifications')
                // }
            ]
        },
    ]);

    const navItems = computed(() => {
        return allNavItems.value[0].items.filter(item =>
            // Check if the item has a required permission and if the user has that permission
            hasPermission(item.requiredPermission).value || !item.requiredPermission
        ).map(item => ({
            label: item.label,
            icon: item.icon,
            command: item.command
        }));
    });

    return { allNavItems, navItems };
};