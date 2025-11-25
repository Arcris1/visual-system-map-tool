
import { ref, computed} from "vue";
import { useRouter } from "vue-router";
import { useGlobalFunctionsUtils } from "@/utils/globalFunctionsUtils";
import { svgIcons } from "@/utils/svgIcons";
import { usePermissions } from '@/composables/usePermissions';
import { useAuthStore } from '@/stores/AuthStore';

export const useMenuConfig = () => { 
    const router = useRouter();
    const authStore = useAuthStore();
    const { hasPermission, PERMISSIONS } = usePermissions();
    
    // Logout Handler
    const { changeLanguage } = useGlobalFunctionsUtils();

    const languages = ref([
        { label: 'English', code: 'en', command: () => changeLanguage('English', 'en') },
        { label: 'French', code: 'fr', command: () => changeLanguage('French', 'fr') },
        { label: 'Chinese', code: 'cn', command: () => changeLanguage('Chinese', 'cn') },
        { label: 'Tagalog', code: 'tl', command: () => changeLanguage('Tagalog', 'tl') },
        { label: 'Japanese', code: 'jp', command: () => changeLanguage('Japanese', 'jp') }
    ]);

    // Check if the side menu should be displayed using permissions

    const allMenuItems = ref([
        { 
            label: 'Dashboard',
            link: '/dashboard',
            active: true,
            requiredPermission: PERMISSIONS.DASHBOARD_ACCESS,
            svgIcons: svgIcons.dashboard
        },
        {
            label: 'Employee Management',
            link: '/employee-management',
            requiredPermission: PERMISSIONS.EMPLOYEE_MANAGEMENT_ACCESS,
            svgIcons: svgIcons.users
        },
        {
            label: 'Attendance',
            link: '/attendance',
            requiredPermission: PERMISSIONS.ATTENDANCE_ACCESS,
            svgIcons: svgIcons.attendance || svgIcons.clock
        },
        {
            label: 'Payroll Management',
            link: '/payroll-management',
            requiredPermission: PERMISSIONS.PAYROLL_MANAGEMENT_ACCESS,
            svgIcons: svgIcons.payroll
        },
        { 
            label: 'Settings',
            link: '/settings',
            requiredPermission: PERMISSIONS.SETTINGS_ACCESS,
            svgIcons: svgIcons.settings
        }
    ]);

    const sideMenuItems = computed(() => {
        return allMenuItems.value.filter(item => 
            // Check if the item has a required permission and if the user has that permission
            hasPermission(item.requiredPermission).value || !item.requiredPermission
        ).map(item =>
            ({
                label: item.label,
                link: item.link,
                svgIcons: item.svgIcons,
                command: () => {
                    // Use the router to navigate to the link
                    router.push(item.link);
                }
            })
        );
    });
    
    const brand = {
        link: '/',
        logo: svgIcons.management,
    };
    
    const userMenuItem = ref([
        {
            separator: true
        },
        {
            label: 'Profile',
            items: [
                {
                    label: 'Profile',
                    icon: 'pi pi-user',
                    command: () => router.push({ name: 'profile' })
                },
                // {
                //     label: 'Settings',
                //     icon: 'pi pi-cog',
                //     shortcut: '⌘+O'
                // },
                // {
                //     label: 'Messages',
                //     icon: 'pi pi-inbox',
                //     badge: 2
                // },
                {
                    label: 'Logout',
                    icon: 'pi pi-sign-out',
                    shortcut: '⌘+Q',
                    command: () => {
                        //console.log('Logging out');
                        authStore.handleLogout().then(() => {
                            router.push({ path: '/login' });
                        });
                    }
                }
            ]
        },
        {
            separator: true
        }
    ]);
    
    // Vue Router documentation
    // https://router.vuejs.org/guide/essentials/navigation.html
    const panelItem = ref([
        {
            label: 'Documents',
            items: [
                {
                    label: 'New',
                    icon: 'pi pi-plus',
                    command: () => {
                        // Recommended: You can use the route name
                        router.push({ name: 'new'}); 
                        // headerTitle.value = 'New';
                    }
                },
                {
                    label: 'Search',
                    icon: 'pi pi-search',
                    command: () => {
                        // literal string path or you can use object with path
                        router.push({ path: '/new'});
                    }
                }
            ]
        },
        {
            label: 'Profile',
            items: [
                {
                    label: 'Settings',
                    icon: 'pi pi-cog',
                    command: () => {
                        // named route with params to let the router build the url
                        router.push({ name: 'new', params: { username: 'johndoe' } });
                    }
                },
                {
                    label: 'Logout',
                    icon: 'pi pi-sign-out',
                    command: () => {
                        //console.log('Logging out');
                        authStore.handleLogout();
                    }
                }
            ]
        }
    ]);

    return { sideMenuItems, brand, userMenuItem, panelItem, languages };
}