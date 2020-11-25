odoo.define('web_email.web_email1', function (require) {
"use strict";
    var field_registry = require('web.field_registry');
    var AppsMenu = require('web.AppsMenu');
    var BasicFields= require('web.basic_fields');

    BasicFields.FieldEmail.include({
    	_render: function() {
            if (!this.get("effective_readonly")) {
                this._super();
            }else{
                if(this.view.dataset._model.name == 'res.partner'){
                    this.$el.find('a').text(this.get('value') || '')
                    this.$el.find('a').attr('href', '/web_emails/compose_mail?partner_id=' + this.view.datarecord.id || '');
                }else{
                    this._super.apply(this);
                }
            }
        },
    });

    // On Menu click (according to menu) disable and enable 
    // web email view and base backend view.
    AppsMenu.include({
    	_onAppsMenuItemClicked: function (ev) {
    		this._super.apply(this, arguments);
    		var $target = $(ev.currentTarget);
            var menuxmlid = $target.data('menu-xmlid');
            if (menuxmlid == 'web_email.menu_website_action_personal_emails'){
            	$('.o_main_content').css({'display':'none'});
            	$('.wrapper').css({'display':'block'});
            	$('body').removeClass().addClass('hold-transition skin-blue sidebar-mini fixed');
            }else{
            	$('body').removeClass().addClass('o_web_client o_no_thread_window');
            	$('.o_main_content').css({'display':'block'});
            	$('.wrapper').css({'display':'none'});
            }
        },
    });
    
});
