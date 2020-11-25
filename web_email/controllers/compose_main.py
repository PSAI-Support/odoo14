# -*- coding: utf-8 -*-
import os
import time
import base64
import imaplib
import tempfile
import mimetypes
import email.utils
import email.header
from odoo import http
from email import encoders
from datetime import datetime
from pytz import timezone
from dateutil import parser
from odoo.http import request
from odoo.tools import ustr
import odoo.tools as tools
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.audio import MIMEAudio
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
import json
from odoo.addons.web_email.controllers.main import webEmail
import logging

_logger = logging.getLogger(__name__)

def filter_email_address(email):
    email = email.strip()
    name = ''
    email_address = ''
    if ' ' in email:
        if '<' in email:
            email_split_list = email.split('<')
            name = email_split_list[0]
            if '>' in email_split_list[1]:
                email_address = email_split_list[1].rpartition('>')[0]
            else:
                email_address = email_split_list[1]
    elif '<' in email and '>' in email:
        email_address_between = email.partition('<')[-1].rpartition('>')[0]
        name = email_address_between
        email_address = email_address_between
    else:
        name = email
        email_address = email
    return tools.ustr(name.strip()), tools.ustr(email_address.strip())

class composeEmail(webEmail):

    @http.route(['/web_emails/compose_mail',
                 '/web_emails/reply',
                 '/web_emails/reply_to_all',
                 '/web_emails/forward',
                 '/web_emails/send_draft'], type='http', auth='user', csrf=False, website=True)
    def compose_new_mail(self, **kwargs):
        if not kwargs.get('account_id'):
            personal_email_credentials_ids = request.env['personal.email.credentials'].sudo().search(
                [('user_id', '=', request.uid), ('default', '=', True)], limit=1, order='id')
        else:
            personal_email_credentials_ids = request.env['personal.email.credentials'].sudo(
            ).browse(int(kwargs.get('account_id')))
        return request.render('web_email.compose_new_mail', {'active_account_id': personal_email_credentials_ids, })

    @http.route(['/compose-new-mail'], type='http', method='POST', auth='public', csrf=False, website=True)
    def compose_mail_new(self, **kwargs):
        contact_obj = request.env['contact.contact']
        user = request.env['res.users'].browse(request.uid)
        tz = request.env.user.tz
        personal_email = request.env['personal.email.credentials'].sudo().browse(
            int(kwargs.get('account_id'))).email_address
        data = {
            'mail_type': kwargs.get('mail_type'),
            'signature': user.signature,
            'personal_email': personal_email,
        }
        res = {}
        contact_list = []
        reply_email_exist = False
        partner_email_exist = False
        partner = False
        if kwargs.get('partner_id'):
            partner = request.env['res.partner'].sudo().browse(
                int(kwargs.get('partner_id')))
            data.update({'partner_id': partner.id})
            res.update({
                'reply_to': [{'id': partner.email, 'text': partner.email}]
            })
        if kwargs.get('contact_id'):
            selected_conatct = contact_obj.sudo().browse(int(kwargs.get('contact_id')))
            res.update({
                'reply_to': [{'id': selected_conatct.email_address, 'text': selected_conatct.email_address}]
            })
        for contact in contact_obj.sudo().search([('user_id', '=', request.uid)]):
            text = ''
            if contact.company_name:
                text += contact.company_name + ' '
            if contact.name:
                text += contact.name
            if contact.last_name:
                text += ' ' + contact.last_name
            if contact.email_address:
                text += ' <' + contact.email_address + '>'
            contact_list.append({'id': contact.email_address, 'text': text})
            if 'reply_to' in kwargs and contact.email_address == kwargs.get('reply_to'):
                reply_email_exist = True
            if partner and 'partner_id' in kwargs and contact.email_address == partner.email:
                partner_email_exist = True
        if kwargs.get('partner_id') and not partner_email_exist:
            contact_list.append({'id': partner.email, 'text': partner.email})
        if kwargs.get('email_id'):
            personal_email_credentials_ids = request.env['personal.email.credentials'].sudo(
            ).browse(int(kwargs.get('account_id')))
            mail = self.authenticate_email(personal_email_credentials_ids.email_address,
                                           personal_email_credentials_ids.password, personal_email_credentials_ids.imap_server)

            if 'current_url' in kwargs and kwargs.get('current_url'):
                url = kwargs.get('current_url')
                current_folder = url.split('folder_name=')[
                    1].split('&email_id')[0]
                if '%20' in current_folder:
                    aa = current_folder.split('%20')
                    current_folder = aa[0] + ' ' + aa[1]
                kwargs['folder_name'] = current_folder
            mail.select('"' + kwargs.get('folder_name') + '"')
            result, mail_data = mail.fetch(kwargs.get('email_id'), "(RFC822)")
            msg = email.message_from_string(ustr(mail_data[0][1]))
            body, attachments = self.fetch_body(msg)
            subject = ustr(email.header.decode_header(
                msg['Subject'])[0][0])
            msg_from = self.msg_from_decode(msg['from'])
            msg_to = msg['To'] if msg['To'] else ''
            inline_body = body
            msg_dt = ''

            if msg['Date']:
                date_tmp = datetime.strftime(parser.parse(msg['Date']), '%Y-%m-%d %H:%M:%S %z')
                date_tmp = parser.parse(date_tmp).astimezone(timezone(tz))
                msg_dt = datetime.strftime(date_tmp, '%m/%d/%Y %H:%M')
            if not kwargs.get('template_id'):
                inline_body = '<br/><br/><blockquote style="border-left: 2px solid blue; margin-left: 8px; padding-left: 8px; font-size:10pt; color:black; font-family:verdana;">-------- Original Message --------<br/>'\
                    + 'Subject: ' + subject + '<br/>'\
                    + 'From: ' + msg_from + '<br/>'\
                    + 'Date: ' + msg_dt + '<br/>'\
                    + 'To: ' + msg_to + '<br/><br/>'\
                    + ustr(body) + '</blockquote>'
            data.update({'inline_body': inline_body,
                         'folder_name': str(kwargs.get('folder_name'))})
            if kwargs.get('template_id') == kwargs.get('email_id') or kwargs.get('mail_type') == 'reply' or kwargs.get('mail_type') == 'reply-to-all':
                reply_to_emails = []
                if kwargs.get('reply_to'):
                    reply_to_emails.append(
                        {'id': kwargs.get('reply_to'), 'text': kwargs.get('reply_to')})
                res.update({
                    'reply_to': reply_to_emails
                })
                if not reply_email_exist:
                    contact_list.append(
                        {'id': kwargs.get('reply_to'), 'text': kwargs.get('reply_to')})
                if not kwargs.get('template_id') and not subject.startswith('Re:') and not subject.startswith('RE:'):
                    subject = "Re: " + subject
                if kwargs.get('template_id') or kwargs.get('mail_type') == 'reply-to-all':
                    reply_to_all_pre_selected = []
                    if 'reply_to_all_emails' in kwargs and kwargs.get('reply_to_all_emails'):
                        for reply_to_all_email in eval(kwargs.get('reply_to_all_emails')):
                            reply_to_all_pre_selected.append(
                                {'id': reply_to_all_email, 'text': reply_to_all_email})
                    res.update({
                        'reply_to_all_emails': reply_to_all_pre_selected
                    })
            elif kwargs.get('mail_type') == 'forward':
                res.update({'attachments': attachments})
                if not subject.startswith('Fwd:'):
                    subject = "Fwd: " + subject
            elif kwargs.get('mail_type') == 'send_draft':
                res.update({'attachments': attachments})
                reply_to_emails = []
                to = ''
                if msg['To']:
                    for to_email in email.header.decode_header(msg['To']):
                        to += to_email[0] + ' '
                if len(to) > 0:
                    reply_to_emails.append(
                        {'id': to, 'text': to})
                cc_all = []
                if msg['Cc'] and ',' in msg['Cc']:
                    for cc_email in msg['Cc'].split(','):
                        name, email_address = filter_email_address(cc_email.strip())
                        if personal_email_credentials_ids.email_address != email_address and email_address:
                            cc_all.append({'id': email_address + ' ', 'text': email_address + ' '})
                elif msg['Cc'] and not ',' in msg['Cc']:
                    name, email_address = filter_email_address(msg['Cc'].strip())
                    if personal_email_credentials_ids.email_address != email_address and email_address:
                        cc_all.append({'id': email_address + ' ', 'text': email_address + ' '})
                bcc_all = []
                if msg['Bcc'] and ',' in msg['Bcc']:
                    for bcc_email in msg['Bcc'].split(','):
                        name, email_address = filter_email_address(bcc_email.strip())
                        if personal_email_credentials_ids.email_address != email_address and email_address:
                            bcc_all.append({'id': email_address + ' ', 'text': email_address + ' '})
                elif msg['Bcc'] and not ',' in msg['Bcc']:
                    name, email_address = filter_email_address(msg['Bcc'].strip())
                    if personal_email_credentials_ids.email_address != email_address and email_address:
                        bcc_all.append({'id': email_address + ' ', 'text': email_address + ' '})
                res.update({
                            'reply_to_all_emails': cc_all,
                            'bcc_all': bcc_all,
                            'reply_to': reply_to_emails
                            });
                data.update({
                            'inline_body': body,
                             'reply_to_all_emails': cc_all,
                             'bcc_all': bcc_all,
                             'reply_to': reply_to_emails
                             })
            mail_server = self.authenticate_mail_server(personal_email_credentials_ids.email_address,
                                                        personal_email_credentials_ids.password,
                                                        personal_email_credentials_ids.imap_server)

            data.update({
                'subject': subject,
                'email_id': kwargs.get('email_id') or '',
                'folder_names': self.folder_names(mail, mail_server.list_folders()),
            })
            self.disconnect(mail)
        html_data = request.env['ir.ui.view'].render_template(
            'web_email.compose_mail', data)
        html_data = bytes(html_data.decode("utf-8"), "utf-8")
        html_data = html_data.decode("utf-8")
        res.update({'html_data': html_data, 'contacts': contact_list})
        return json.dumps(res)

    def move_draft_mails(self, kwargs):
        personal_email_credentials_ids = request.env['personal.email.credentials'].sudo().browse(
            int(kwargs.get('account_id')))
        mail = self.authenticate_email(personal_email_credentials_ids.email_address,
                                       personal_email_credentials_ids.password,
                                       personal_email_credentials_ids.imap_server)
        mail.select(
            mailbox='"' + kwargs.get('folder_name') + '"', readonly=False)
        resp, data = mail.fetch(kwargs.get('email_id'), "(UID)")
        if personal_email_credentials_ids.imap_server == 'imap.gmail.com':
            for res in data:
                mail.store(kwargs.get('email_id'),
                           '+X-GM-LABELS', '\\Trash')
            return True
        else:
            for res in data:
                mail.store(kwargs.get('email_id'),
                           '+X-GM-LABELS', '\\Trash')
            return True

    @http.route(['/send-mail'], type='http', method='POST', auth='public', csrf=False, website=True)
    def send_mail(self, **kwargs):
        personal_email_credentials_ids = request.env['personal.email.credentials'].sudo(
        ).browse(int(kwargs.get('account_id')))
        mail = request.env['ir.mail_server'].connect(personal_email_credentials_ids.smtp_server, 465,
                                                     personal_email_credentials_ids.email_address, personal_email_credentials_ids.password, 'ssl')
        mail_server = self.authenticate_mail_server(personal_email_credentials_ids.email_address,
                                                    personal_email_credentials_ids.password,
                                                    personal_email_credentials_ids.imap_server)
        new = MIMEMultipart("mixed")
        body = MIMEMultipart("alternative")
        body.attach(MIMEText(kwargs.get('body'), "html", 'utf-8'))
        new.attach(body)
        new["Subject"] = kwargs.get('subject')
        new["To"], all_to_email_list = self.filter_send_mail(kwargs.get('to'))
        new["Cc"], all_cc_email_list = self.filter_send_mail(kwargs.get('cc'))
        bcc_emails, all_bcc_email_list = self.filter_send_mail(
            kwargs.get('bcc'))
        new["Date"] = datetime.now().strftime("%d/%m/%Y %H:%M")
        imap_mail = self.authenticate_email(personal_email_credentials_ids.email_address,
                                            personal_email_credentials_ids.password, personal_email_credentials_ids.imap_server)
        if kwargs.get('partner_id'):
            request.env['mail.message'].sudo().create({
                'body': kwargs.get('body'),
                'model': 'res.partner',
                'res_id': kwargs.get('partner_id'),
                'subtype_id': request.env['mail.message.subtype'].sudo().search([('name', '=', 'Discussions')], limit=1).id,
                'author_id': request.env['res.users'].sudo().browse(request.uid).partner_id.id,
                'message_type': 'email',
            })
            request.env['email.activities.history'].sudo().create({
                'partner_id': kwargs.get('partner_id'),
                'subject': kwargs.get('subject'),
                'body': kwargs.get('body'),
                'email_from': personal_email_credentials_ids.email_address,
                'email_to': kwargs.get('to'),
            })
        jd = json.dumps(kwargs.get('attach_list'))
        at_list = eval(json.loads(jd))
        for file_data in at_list or []:
            scr_file_path = os.path.join(
                tempfile.gettempdir()) + '/' + file_data.get('name')
            outfile = open(scr_file_path, 'wb')
            outfile.write(base64.b64decode(
                file_data.get('datas').split(',')[1]))
            outfile.close()
            ctype, encoding = mimetypes.guess_type(scr_file_path)
            if ctype is None or encoding is not None:
                ctype = "application/octet-stream"
            maintype, subtype = ctype.split("/", 1)
            if maintype == "text":
                fp = open(scr_file_path)
                attachment = MIMEText(fp.read(), _subtype=subtype)
            elif maintype == "image":
                fp = open(scr_file_path, 'rb')
                attachment = MIMEImage(
                    fp.read(), _subtype=subtype, encoding="ISO-8859-1")
            elif maintype == "audio":
                fp = open(scr_file_path, 'rb')
                attachment = MIMEAudio(fp.read(), _subtype=subtype)
            else:
                fp = open(scr_file_path, 'rb')
                attachment = MIMEBase(maintype, subtype)
                attachment.set_payload(fp.read())
                encoders.encode_base64(attachment)
            fp.close()
            attachment.add_header("Content-Disposition",
                                  "attachment", filename=file_data.get('name'))
            new.attach(attachment)
            os.remove(scr_file_path)
        if kwargs.get('mail_type') == 'reply' or kwargs.get('mail_type') == 'reply-to-all':
            imap_mail.select('"' + kwargs.get('folder_name') + '"')
            result, data = imap_mail.fetch(kwargs.get('email_id'), "(RFC822)")
            new_data = bytes(data[0][1].decode("utf-8"), "utf-8")
            new_data = new_data.decode("utf-8")
            original = email.message_from_string(new_data)
            new["Message-ID"] = email.utils.make_msgid()
            new["In-Reply-To"] = original["Message-ID"]
            new["References"] = original["Message-ID"]
            new["From"] = personal_email_credentials_ids.email_address
        elif kwargs.get('mail_type') == 'new' or kwargs.get('mail_type') == 'forward':
            if kwargs.get('mail_type') == 'forward':
                imap_mail.select('"' + kwargs.get('folder_name') + '"')
            new["Message-ID"] = email.utils.make_msgid()
            new["In-Reply-To"] = personal_email_credentials_ids.email_address
            new["From"] = personal_email_credentials_ids.email_address
        if kwargs.get('mail_type') != 'new' and 'send_and_delete' in kwargs and kwargs.get('send_and_delete'):
            if personal_email_credentials_ids.imap_server == 'imap.gmail.com':
                self.child_move_records(imap_mail, str(kwargs.get('email_id')), str(
                    kwargs.get('folder_name')), str("[Gmail]/Corbeille"),kwargs.get('account_id'))
            else:
                self.child_move_records(mail, kwargs.get('email_id'), str(kwargs.get('folder_name')),
                                        str(kwargs.get('move_to')), kwargs.get('account_id'))
        if kwargs.get('mail_type') != 'new' and 'send_and_move' in kwargs and kwargs.get('send_and_move'):
            self.child_move_records(imap_mail, str(kwargs.get('email_id')), str(
                kwargs.get('folder_name')), str(kwargs.get('move_to')),kwargs.get('account_id'))
        if kwargs.get('mail_type') == 'send_draft':
            if personal_email_credentials_ids.imap_server == 'imap.gmail.com':
                self.move_draft_mails(kwargs)
            else:
                self.child_move_records(imap_mail, str(kwargs.get('email_id')), str(
                    kwargs.get('folder_name')), 'Trash', kwargs.get('account_id'))
        self.disconnect(imap_mail)
        mail.sendmail(personal_email_credentials_ids.email_address,
                          all_to_email_list + all_cc_email_list + all_bcc_email_list, new.as_string().encode('utf-8'))
        mail.quit()
        return json.dumps({'send': True})

    @http.route(['/draft', '/save-template'], type='http', method='POST', auth='public', csrf=False, website=True)
    def draft(self, **kwargs):
        personal_email_credentials_ids = request.env['personal.email.credentials'].sudo(
        ).browse(int(kwargs.get('account_id')))
        message = MIMEMultipart()
        message['Subject'] = kwargs.get('subject')
        message['From'] = personal_email_credentials_ids.email_address
        message['to'] = kwargs.get('to')
        message['cc'] = kwargs.get('cc')
        message["Date"] = datetime.now().strftime("%d/%m/%Y %H:%M")
        message['bcc'] = kwargs.get('bcc')
        message.attach(MIMEText(kwargs.get('body'), "html", 'utf-8'))
        mail = self.authenticate_email(personal_email_credentials_ids.email_address,
                                       personal_email_credentials_ids.password, personal_email_credentials_ids.imap_server)

        if kwargs.get('attach_list'):
            jd = json.dumps(kwargs.get('attach_list'))
            at_list = eval(json.loads(jd))
            for file_data in at_list or []:
                scr_file_path = os.path.join(
                    tempfile.gettempdir()) + '/' + file_data.get('name')
                outfile = open(scr_file_path, 'wb')
                outfile.write(base64.b64decode(
                    file_data.get('datas').split(',')[1]))
                outfile.close()
                ctype, encoding = mimetypes.guess_type(scr_file_path)
                if ctype is None or encoding is not None:
                    ctype = "application/octet-stream"
                maintype, subtype = ctype.split("/", 1)
                if maintype == "text":
                    fp = open(scr_file_path)
                    attachment = MIMEText(fp.read(), _subtype=subtype)
                elif maintype == "image":
                    fp = open(scr_file_path, 'rb')
                    attachment = MIMEImage(fp.read(), _subtype=subtype)
                elif maintype == "audio":
                    fp = open(scr_file_path, 'rb')
                    attachment = MIMEAudio(fp.read(), _subtype=subtype)
                else:
                    fp = open(scr_file_path, 'rb')
                    attachment = MIMEBase(maintype, subtype)
                    attachment.set_payload(fp.read())
                    encoders.encode_base64(attachment)
                fp.close()
                attachment.add_header(
                    "Content-Disposition", "attachment", filename=file_data.get('name'))
                message.attach(attachment)
                os.remove(scr_file_path)

        if kwargs.get('save_draft'):
            if personal_email_credentials_ids.imap_server == 'imap.gmail.com':
                mail_server = self.authenticate_mail_server(personal_email_credentials_ids.email_address,
                                                            personal_email_credentials_ids.password,
                                                            personal_email_credentials_ids.imap_server)
                draft_folder_name = ''
                draft_folder = ('\\Drafts', '\\HasNoChildren')
                for label, list_folder in zip(mail.list()[1], mail_server.list_folders()):
                    if draft_folder in list_folder:
                        draft_folder_name = label.split(
                            '"/"')[-1].replace('"', '').strip()
                mail.append('[Gmail]/Drafts', '\Draft', imaplib.Time2Internaldate(
                    time.time()), message.as_string().encode('utf-8'))
            else:
                mail.append("Draft", '\Draft', imaplib.Time2Internaldate(
                    time.time()), message.as_string().encode('utf-8'))
        if kwargs.get('save_template'):
            mail.append("Email_Templates", '', imaplib.Time2Internaldate(
                time.time()), message.as_string().encode('utf-8'))
        return json.dumps({'save': True})
