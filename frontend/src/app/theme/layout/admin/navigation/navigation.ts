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
        id: 'contacts',
        title: 'Contatos',
        type: 'collapse',
        icon: 'ti ti-users',
        breadcrumbs: false,
        children: [
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
        id: 'clients',
        title: 'Clientes',
        type: 'item',
        url: '/clients',
        icon: 'ti ti-user-check'
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
        id: 'whatsapp',
        title: 'WhatsApp',
        type: 'item',
        url: '/whatsapp',
        icon: 'ti ti-brand-whatsapp'
      },
      {
        id: 'users',
        title: 'Usuários',
        type: 'item',
        url: '/users',
        icon: 'ti ti-users-group'
      }
    ]
  }
];
