from odoo import models, fields, api


class contact_contact(models.Model):

    _description = 'Stored Contacts'
    _name = 'contact.contact'

    name = fields.Char('First Name')
    last_name = fields.Char('Last name')
    email_address = fields.Char('Email Address')
    user_id = fields.Many2one('res.users', 'User')
    company_name = fields.Char('Company Name')
    partner_id = fields.Many2one('res.partner', 'Partner')
