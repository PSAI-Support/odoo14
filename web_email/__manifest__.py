# See LICENSE file for full copyright and licensing details.
{
    'name': 'Odoo as Inbox - Email Interface',
    'version': '13.0.1.0.0',
    'category': 'Extra Tools',
    'license': 'LGPL-3',
    'description': '''This module provides email interface for gmail and yahoo accounts.
        Web Email
        Web Email Interface''',
    'summary': '''This module provides email interface for gmail and yahoo accounts.
        Web Email
        Web Email Interface''',
    'author': 'Serpent Consulting Services Pvt. Ltd.',
    'website': 'http://www.serpentcs.com',
    'depends': ['website', 'mail', 'contacts'],
    'data': [
        'security/ir.model.access.csv',
        'security/emails_security.xml',
        'views/res_data.xml',
        'data/data.xml',
        'views/res_users.xml',
        'views/res_partner.xml',
        'views/layout.xml',
        'views/template.xml',
    ],
    'images': ['static/description/webemail_banner.jpg'],
    'application': False,
    'auto_install': False,
    'price': 399,
    'currency': 'EUR',
}
