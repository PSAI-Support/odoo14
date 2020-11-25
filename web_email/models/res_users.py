# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import imaplib
import smtplib
from odoo.exceptions import UserError


class personal_email_credentials(models.Model):

    _name = 'personal.email.credentials'

    user_id = fields.Many2one('res.users', 'User Id')
    email_address = fields.Char('User Email Address')
    password = fields.Char('Password')
    imap_server = fields.Char('IMAP Server')
    imap_port = fields.Char('IMAP Port')
    smtp_server = fields.Char('SMTP Server')
    smtp_port = fields.Char('SMTP Port')
    default = fields.Boolean('Default')

    @api.constrains('default')
    def _constraint_default(self):
        rec = self.search([('user_id', '=', self.user_id.id), ('default', '=', True)])
        if(len(rec)>1):
            raise UserError(_('You can only select one default account.'))

    @api.model
    def create(self, vals):
        try:
            mail = imaplib.IMAP4_SSL(vals.get('imap_server'))
        except:
            raise UserError(_('IMAP Server not found.'))
        try:
            connection = smtplib.SMTP_SSL(vals.get('smtp_server'), '465')
        except:
            raise UserError(_('SMTP Server not found.'))
        try:
            connection.login(vals.get('email_address'), vals.get('password'))
        except:
            raise UserError(_('SMTP Login Failed for %s.') %
                            vals.get('email_address'))
        try:
            mail.login(vals.get('email_address'), vals.get('password'))
        except:
            raise UserError(_('IMAP Login Failed for %s.') %
                            vals.get('email_address'))
        return super(personal_email_credentials, self).create(vals)


    def write(self, vals):
        mail = imaplib.IMAP4_SSL(self.imap_server)
        connection = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
        if vals.get('imap_server'):
            try:
                mail = imaplib.IMAP4_SSL(vals.get('imap_server'))
            except:
                raise UserError(_('IMAP Server not found.'))
        if vals.get('smtp_server'):
            try:
                connection = smtplib.SMTP_SSL(vals.get('smtp_server'), '465')
            except:
                raise UserError(_('SMTP Server not found.'))

        if vals.get('email_address') or vals.get('password'):
            if vals.get('email_address') and vals.get('password'):
                try:
                    mail.login(vals.get('email_address'), vals.get('password'))
                except:
                    raise UserError(_('IMAP Login Failed for %s.') %
                                    vals.get('email_address'))
                try:
                    connection.login(vals.get('email_address'),
                                     vals.get('password'))
                except:
                    raise UserError(_('SMTP Login Failed for %s.') %
                                    vals.get('email_address'))

            if vals.get('email_address') and not vals.get('password'):
                try:
                    mail.login(vals.get('email_address'), self.password)
                except:
                    raise UserError(_('IMAP Login Failed for %s.') %
                                    vals.get('email_address'))
                try:
                    connection.login(vals.get('email_address'), self.password)
                except:
                    raise UserError(_('SMTP Login Failed for %s.') %
                                    vals.get('email_address'))

            if vals.get('password')and not vals.get('email_address'):
                try:
                    mail.login(self.email_address, vals.get('password'))
                except:
                    raise UserError(_('IMAP Login Failed for %s.') %
                                    self.email_address)
                try:
                    connection.login(self.email_address, vals.get('password'))
                except:
                    raise UserError(_('SMTP Login Failed for %s.') %
                                    self.email_address)
        return super(personal_email_credentials, self).write(vals)

    @api.onchange('default')
    def _onchange_default(self):
        self._origin.default = self.default


class res_users(models.Model):

    _inherit = 'res.users'

    personal_email_credentials_ids = fields.One2many(
        'personal.email.credentials', 'user_id', 'Personal Email Credentials')
