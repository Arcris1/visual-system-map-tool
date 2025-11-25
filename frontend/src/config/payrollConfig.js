import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/AuthStore';
import { svgIcons } from '@/utils/svgIcons';

export const usePayrollConfig = () => {
    const router = useRouter();
    const { t, locale } = useI18n();
    
    const navItems = computed(() => [
        {
            label: 'Payroll Management',
            icon: 'pi pi-user',
            items: [
                {
                    label: 'Payroll',
                    svgIcons: svgIcons.payroll,
                    command: () => router.push('/payroll')
                },
                {
                    label: 'Payslips',
                    svgIcons: svgIcons.payslip,
                    command: () => router.push('/payslips')
                },
                {
                    label: 'Payroll Components',
                    svgIcons: svgIcons.payslip,
                    command: () => router.push('/payroll-components')
                },
                {
                    label: 'Payroll Templates',
                    svgIcons: svgIcons.payslip,
                    command: () => router.push('/payroll-templates')
                }
            ]
        },
        {
            label: 'Payroll Approval Workflow',
            icon: 'pi pi-check-square',
            items: [
                {
                    label: 'Generate Payslips',
                    icon: 'pi pi-plus-circle',
                    command: () => router.push('/payroll/generate')
                },
                {
                    label: 'All Batches',
                    icon: 'pi pi-list',
                    command: () => router.push('/payroll/batches')
                },
                {
                    label: 'Pending Approvals',
                    icon: 'pi pi-clock',
                    command: () => router.push('/payroll/approvals/pending')
                }
            ]
        }
    ]);

    return { navItems };
};