export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  role?: string[];
  isMainParent?: boolean;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'menu',
    title: 'Menu',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/default',
        icon: 'ti ti-layout-dashboard',
        role: ['MASTER_ADMIN', 'DEV_SUPORTE']
      },
      {
        id: 'my-panel',
        title: 'Meu Painel',
        type: 'item',
        url: '/meu-painel',
        icon: 'ti ti-checkup-list',
        role: ['MASTER_ADMIN', 'DEV_SUPORTE', 'COLABORADOR']
      },
      {
        id: 'contacts',
        title: 'Contatos',
        type: 'collapse',
        icon: 'ti ti-users',
        breadcrumbs: false,
        children: [
          {
            id: 'contacts-whatsapp',
            title: 'WhatsApp',
            type: 'item',
            url: '/whatsapp',
            breadcrumbs: false
          },
          {
            id: 'contacts-geral',
            title: 'Geral',
            type: 'item',
            url: '/contacts/geral',
            breadcrumbs: false
          },
          {
            id: 'contacts-nao-lidas',
            title: 'Não Lidas',
            type: 'item',
            url: '/contacts/nao-lidas',
            breadcrumbs: false
          },
          {
            id: 'contacts-em-andamento',
            title: 'Em Andamento',
            type: 'item',
            url: '/contacts/em-andamento',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'client-management',
        title: 'Gestão de Clientes',
        type: 'collapse',
        icon: 'ti ti-user-check',
        breadcrumbs: false,
        children: [
          {
            id: 'client-management-clients',
            title: 'Clientes',
            type: 'item',
            url: '/clients',
            breadcrumbs: false
          },
          {
            id: 'client-management-services',
            title: 'Serviços',
            type: 'item',
            url: '/clients/services',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'services',
        title: 'Procedimentos',
        type: 'item',
        url: '/services',
        icon: 'ti ti-briefcase'
      },
      {
        id: 'products',
        title: 'Produtos',
        type: 'collapse',
        icon: 'ti ti-package',
        breadcrumbs: false,
        children: [
          {
            id: 'products-list',
            title: 'Produtos',
            type: 'item',
            url: '/products',
            breadcrumbs: false
          },
          {
            id: 'products-types',
            title: 'Tipos de Produto',
            type: 'item',
            url: '/products/types',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'agenda',
        title: 'Agenda',
        type: 'item',
        url: '/agenda',
        icon: 'ti ti-calendar-event'
      },
      {
        id: 'finance',
        title: 'Financeiro',
        type: 'collapse',
        icon: 'ti ti-cash',
        breadcrumbs: false,
        children: [
          {
            id: 'finance-incomes',
            title: 'Receitas',
            type: 'item',
            url: '/finance/incomes',
            breadcrumbs: false
          },
          {
            id: 'finance-expenses',
            title: 'Despesas',
            type: 'item',
            url: '/finance/expenses',
            breadcrumbs: false
          },
          {
            id: 'finance-product-sales',
            title: 'Vendas Avulsas',
            type: 'item',
            url: '/finance/product-sales',
            breadcrumbs: false
          },
          {
            id: 'finance-report',
            title: 'Relatório Financeiro',
            type: 'item',
            url: '/finance/report',
            breadcrumbs: false
          },
          {
            id: 'finance-income-types',
            title: 'Tipos de Receita',
            type: 'item',
            url: '/finance/income-types',
            breadcrumbs: false
          },
          {
            id: 'finance-expense-types',
            title: 'Tipos de Despesa',
            type: 'item',
            url: '/finance/expense-types',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'users',
        title: 'Usuários',
        type: 'item',
        url: '/users',
        icon: 'ti ti-users-group'
      },
      {
        id: 'collaborators',
        title: 'Colaboradores',
        type: 'item',
        url: '/collaborators',
        icon: 'ti ti-user-star',
        role: ['MASTER_ADMIN', 'DEV_SUPORTE']
      },
      {
        id: 'settings',
        title: 'Configurações',
        type: 'collapse',
        icon: 'ti ti-settings',
        breadcrumbs: false,
        children: [
          {
            id: 'settings-anamnesis-questions',
            title: 'Perguntas de Anamnese',
            type: 'item',
            url: '/settings/anamnesis-questions',
            breadcrumbs: false
          }
        ]
      }
    ]
  }
];
