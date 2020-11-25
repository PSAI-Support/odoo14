# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.http import request
import odoo.tools as tools
import logging
_logger = logging.getLogger(__name__)


class email_activities_history(models.Model):

    _description = 'Email Activities History'
    _name = 'email.activities.history'

    partner_id = fields.Many2one('res.partner', 'Contacts')
    date = fields.Datetime('Date', default=fields.Datetime.now)
    subject = fields.Char('Subject')
    body = fields.Html('Contents', default='',
                       help='Automatically sanitized HTML contents')
    email_from = fields.Char('From')
    email_to = fields.Char('TO')


class res_partner(models.Model):

    _inherit = "res.partner"

    email_activities_ids = fields.One2many(
        'email.activities.history', 'partner_id', "Email Activities")
    company_name = fields.Char('Company')

    @api.model
    def cust_method(self):
        for partner in self.search([]):
            cust = {}
            cust['id'] = partner.id
            cust['name'] = partner.name
            cust['email'] = partner.email
            cust['company_name'] = partner.company_name
            personal_email_contact_vals = {
                'email_address': cust.get('email'),
                'partner_id': cust.get('id'),
                'user_id': request.uid
            }
            if cust.get('name') and ' ' in cust.get('name'):
                full_name = cust.get('name').split(' ')
                personal_email_contact_vals.update({
                    'name': tools.ustr(full_name[0]),
                    'last_name': tools.ustr(full_name[1])
                })
            else:
                personal_email_contact_vals.update({
                    'name': cust.get('name'),
                })
            if 'company_name' in cust and cust.get('company_name'):
                personal_email_contact_vals.update({
                    'company_name': cust.get('company_name')
                })
            self.env['contact.contact'].sudo().create(
                personal_email_contact_vals)

    @api.model
    def create(self, vals):
        res = super(res_partner, self).create(vals)
        personal_email_contact_vals = {
            'email_address': vals.get('email'),
            'partner_id': res.id,
            'user_id': request.uid
        }
        if ' ' in vals.get('name'):
            full_name = vals.get('name').split(' ')
            personal_email_contact_vals.update({
                'name': tools.ustr(full_name[0]),
                'last_name': tools.ustr(full_name[1])
            })
        else:
            personal_email_contact_vals.update({
                'name': vals.get('name'),
            })
        if 'company_name' in vals and vals.get('company_name'):
            personal_email_contact_vals.update({
                'company_name': vals.get('company_name')
            })
        request.env['contact.contact'].sudo().create(
            personal_email_contact_vals)
        return res


    def write(self, vals):
        res = super(res_partner, self).write(vals)
        for rec in self:
            contact = request.env['contact.contact'].sudo().search(
                [('partner_id', '=', rec.id)])
            personal_email_contact_vals = {}
            if 'email' in vals and vals.get('email'):
                personal_email_contact_vals.update({
                    'email_address': vals.get('email')
                })
            if 'name' in vals and vals.get('name'):
                if ' ' in vals.get('name'):
                    full_name = vals.get('name').split(' ')
                    personal_email_contact_vals.update({
                        'name': tools.ustr(full_name[0]),
                        'last_name': tools.ustr(full_name[1])
                    })
                else:
                    personal_email_contact_vals.update({
                        'name': vals.get('name'),
                    })
            if 'company_name' in vals and vals.get('company_name'):
                personal_email_contact_vals.update({
                    'company_name': vals.get('company_name')
                })
            if contact:
                contact.sudo().write(personal_email_contact_vals)
            else:
                personal_email_contact_vals.update({
                    'partner_id': rec.id,
                    'user_id': request.uid
                })
                self.env['contact.contact'].sudo().create(
                    personal_email_contact_vals)
        return res
