odoo.define('web_email.custom', function (require) {
"use strict";
var odoo = require('web.ajax');
     $(function(){
        $('span.oe_menu_text:contains("Personal Emails")').parent().parent().addClass('active')
        var page = 0;
        var step = 15;
        var selected_records_ids = new Array();
        if(!GetURLParameter('folder_name')){
            $('.folders li:first').addClass('active');
        } else {
            var selector = '.folders li a[data-folder_name="'+ GetURLParameter('folder_name') +'"]'
            $(selector).parent().parent().addClass('active');
        }
        var account_id = $('html').data('active_account_id');
        // Folders Tree
        function folders_toggle(self) {
            var children = $(self).parent().parent('li.parent_li').find(' > ul > li');
            if (children.is(":visible")) {
                children.hide('fast');
                $(self).attr('title', 'Expand this folder').parent().find(' > span > i').addClass('fa-plus-square-o').removeClass('fa-minus-square-o');
                $(self).attr('titlesearch-btn', 'Expand this folder').parent().parent('li.parent_li').find('> div > a > i').addClass('fa-folder').removeClass('fa-folder-open');
            } else {
                children.show('fast');
                $(self).attr('title', 'Collapse this folder').parent().find(' > span > i').addClass('fa-minus-square-o').removeClass('fa-plus-square-o');
                $(self).attr('title', 'Collapse this folder').parent().parent('li.parent_li').find('> div > a > i').addClass('fa-folder-open').removeClass('fa-folder');
            }
        }
        var parents = $('.tree li:has(ul)').addClass('parent_li').find(' div > span')
        $(parents).attr('title', 'Expand this folder');
        $.each(parents, function(){
            folders_toggle(this);
        });
        $('.tree li.parent_li div > span').on('click', function (e) {
            folders_toggle(this);
            e.stopPropagation();
        });
        $('.folders li div').click(function(){
            page = 0;
            step = 15;
            email_ids = []
            selected_records_ids = new Array();
            $('.folders li').removeClass('active');
            $(this).parent().addClass('active');
            $('input[name="search"]').val('')
            emails({'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})
        });
        
        $('.oe_edit_folder').click(function(e){
        	e.stopPropagation()
        })
        
        function ajaxindicatorstart(text)
        {
            if(jQuery('body').find('#resultLoading').attr('id') != 'resultLoading'){
            jQuery('body').append('<div id="resultLoading" style="display:none"><div><img src="/web_email/static/src/img/ajax-loader.gif"><div>'+text+'</div></div><div class="bg"></div></div>');
            }

            jQuery('#resultLoading').css({
                'width':'100%',
                'height':'100%',
                'position':'fixed',
                'z-index':'10000000',
                'top':'0',
                'left':'0',
                'right':'0',
                'bottom':'0',
                'margin':'auto'
            });

            jQuery('#resultLoading .bg').css({
                'background':'#000000',
                'opacity':'0.7',
                'width':'100%',
                'height':'100%',
                'position':'absolute',
                'top':'0'
            });

            jQuery('#resultLoading>div:first').css({
                'width': '250px',
                'height':'75px',
                'text-align': 'center',
                'position': 'fixed',
                'top':'0',
                'left':'0',
                'right':'0',
                'bottom':'0',
                'margin':'auto',
                'font-size':'16px',
                'z-index':'10',
                'color':'#ffffff'

            });

            jQuery('#resultLoading .bg').height('100%');
            jQuery('#resultLoading').fadeIn(300);
            jQuery('body').css('cursor', 'wait');
        }

        function ajaxindicatorstop()
        {
            jQuery('#resultLoading .bg').height('100%');
            jQuery('#resultLoading').fadeOut(300);
            jQuery('body').css('cursor', 'default');
        }

        var email_ids = []
        function emails(view){
            window.history.pushState(view['folder_name'], "Folder", "/web_emails/folder?account_id=" + account_id + "&folder_name=" + view['folder_name']);
            ajaxindicatorstart('Please wait...')
            view['account_id'] = account_id
            odoo.jsonRpc('/emails', 'call', view).then(function(data){
                $('.content_first').html(data['html_data'])
                $('.content_first').parent().css('height', $('.content_first').children().height() + 115)
                email_ids = data['id_list']
                $(".draggable").draggable({
                 helper: function(){
                        var selected = $('#inbox_table tr.selected');
                        var conversions = ' conversions';
                        if (selected.length === 0) {
                            selected = $(this).addClass('selected');
                            $(this).find('.selected-records').prop('checked', true).change()
                            conversions = ' conversion'
                        }
                        var container = $('<div style="background-color:#ffc;z-index: 811;"/>').attr('id', 'draggingContainer');
                        container.append('Move ' + selected.length + conversions );
                        return container;
                    }
                });
                $( ".droppable" ).droppable({
                    hoverClass: "ui-state-hover",
                    drop: function( event, ui ) {
                        move_records(selected_records_ids, 'list', $(this).find('a.folder_name').data('folder_name'), $('.folders li.active a').data('folder_name'))
                    }
                  });
                var lastChecked = null;
                var $chkboxes = $('input[type=checkbox][class=selected-records]');
                $chkboxes.click(function(e) {
                    if(!lastChecked) {
                        lastChecked = this;
                        return;
                    }
                    if(e.shiftKey) {
                        var start = $chkboxes.index(this);
                        var end = $chkboxes.index(lastChecked);
                        $chkboxes.slice(Math.min(start,end), Math.max(start,end)+ 1).prop('checked', lastChecked.checked).change();
                    }
                    lastChecked = this;
                });

            }).then(function(){
            	ajaxindicatorstop()
            })

        }

        var folder_names = []

        odoo.jsonRpc('/folder_list', 'call', {'account_id': account_id}).then(function(data){
        	folder_names = data['label_list2'];
        	$('input[name="adv_folder_name"]').select2({
				allowClear: true,
				multiple: 'multiple',
				data: data['label_list']
			})
			$('#date_from').datepicker();
			$('#date_to').datepicker();
        })

        $(window).on('load',function() {
            $('.folders li div').off('click').on('click',function(){
                page = 0;
                step = 15;
                email_ids = []
                selected_records_ids = new Array();
                $('.folders li').removeClass('active');
                $(this).parent().addClass('active');
                $('input[name="search"]').val('')
                emails({'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})
            });



        	function GetURLParameter(sParam){
                var sPageURL = window.location.search.substring(1);
                var sURLVariables = sPageURL.split('&');
                for (var i = 0; i < sURLVariables.length; i++)
                {
                    var sParameterName = sURLVariables[i].split('=');
                    if (sParameterName[0] == sParam)
                    {
                        return decodeURIComponent(sParameterName[1]);
                    }
                }
            }
            if (window.location.pathname == '/web_emails/compose_mail'){
                var data = {'mail_type': 'new'}
                if(GetURLParameter('partner_id'))
                    data['partner_id'] = GetURLParameter('partner_id')
                else if(GetURLParameter('contact_id'))
                    data['contact_id'] = GetURLParameter('contact_id')
                if(GetURLParameter('email_id'))
                    data['email_id'] = GetURLParameter('email_id')
                if(GetURLParameter('folder_name'))
                    data['folder_name'] = GetURLParameter('folder_name')
                if(GetURLParameter('template_id'))
                    data['template_id'] = GetURLParameter('template_id')
                if(GetURLParameter('reply_to'))
                    data['reply_to'] = GetURLParameter('reply_to')
                if(GetURLParameter('reply_to_all_emails'))
                    data['reply_to_all_emails'] = GetURLParameter('reply_to_all_emails')
                compose_mail(data)
            }
            
            if (window.location.pathname == '/web_emails' || window.location.pathname == '/web_email#'){
                $('.folders li:first div').click();
            }
            
            if (window.location.pathname == '/web_emails/folder'){
                var folder_name = GetURLParameter('folder_name');
                $('.folders li').removeClass('active');
                var selector = '.folders li a[data-folder_name="'+ folder_name +'"]'
                $(selector).parent().parent().addClass('active');
                emails({'folder_name': folder_name, 'page': page, 'step': step, 'folder_names': folder_names})
            }
            if(window.location.pathname == '/web_emails/open_record'){
                var folder_name = GetURLParameter('folder_name');
                $('.folders li').removeClass('active');
                var selector = '.folders li a[data-folder_name="'+ folder_name +'"]'
                $(selector).parent().parent().addClass('active');
                open_record(GetURLParameter('email_id'))
            }
            if(window.location.pathname == '/web_emails/contacts'){
                search_contacts()
            }

            // Expand active folders parents
            var len = $('.tree li.active').parents("li.parent_li");
            $.each(len.find('> div > span'), function(){
                folders_toggle(this);
            });

            if(!GetURLParameter('email_id')){
                $.when(
                    emails({'search': $(this).parent().parent().find('input[name="search"]').val(), 'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})
                ).done(close_modal());
            }
        });

        function close_modal(){
            $('.advance-search-lg-modal').modal('hide');
        }
        $(document).on('click', '.search-btn', function(e){
            var error = 0
            if ($.trim($(this).parent().parent().find('input[name="search"]').val()).length === 0){
                error++;
            }
            if (error > 0){
                $(this).parent().parent().find('input[name="search"]').addClass('val-error')
                return false;
            }else{
            	e.preventDefault();
            	page = 0;
                step = 15;
                email_ids = []
                $.when(emails({'search': $(this).parent().parent().find('input[name="search"]').val(), 'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})).done(close_modal());
                $(this).parent().parent().find('input[name="search"]').val('')
            }
        })
        if(!GetURLParameter('email_id')){
            $.when(
                emails({'search': $(this).parent().parent().find('input[name="search"]').val(), 'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})
            ).done(close_modal());
        }

        if(window.location.pathname == '/web_emails/open_record'){
            var folder_name = GetURLParameter('folder_name');
            $('.folders li').removeClass('active');
            var selector = '.folders li a[data-folder_name="'+ folder_name +'"]'
            $(selector).parent().parent().addClass('active');
            open_record(GetURLParameter('email_id'))
        }

        $(document).on('change', 'select[name="limit_selection"]', function(e){
        	selected_records_ids = new Array();
            page = 0;
            step = $(this).val();
            emails({'email_ids': email_ids, 'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names, 'search': $('input[name="search"]').val()})
        })

        $(document).on('click', '.email_pager ul li a', function(e){
        	selected_records_ids = new Array();
            e.preventDefault();
            var view = {
                'folder_name': $('.folders li.active a').data('folder_name'),
                'step': $('select[name="limit_selection"]').val(),
                'folder_names': folder_names,
                'search': $('input[name="search"]').val(),
                'email_ids': email_ids,
            }
            if ($(this).text() == 'Next'){
                view['page'] = parseInt($('.email_pager ul li.active a').text()) + 1;
            }else if($(this).text() == 'Prev'){
                view['page'] = parseInt($('.email_pager ul li.active a').text()) - 1;
            }else{
            	if (page != 0){
            		page -= 1
            	}
                view['page'] = $(this).text();
            }
            page = view['page'];
            emails(view)
        })

        $(document).on('change', '.select_all_move_records', function(){
        	if( $(this).prop('checked') ){
        		$('.selected-records').prop('checked', true).change();
        	}else{
        		$('.selected-records').prop('checked', false).change();
        	}
        })
        var selected_records_contact_ids = []
        $(document).on('change', '.select_all_contact', function(){
        	if( $(this).prop('checked') ){
        		$('.select_contact').prop('checked', true).change();
        	}else{
        		$('.select_contact').prop('checked', false).change();
        	}
        })

        $(document).on('change', '.select_contact', function(){
            if($(this).prop('checked')){
            	if (selected_records_contact_ids.indexOf($(this).data('contact_id')) == -1){
            		$(this).parent().parent().addClass('selected')
            		selected_records_contact_ids.push($(this).data('contact_id'))
            	}
            }else{
            	$('.select_all_contact').prop('checked', false)
                var index = selected_records_contact_ids.indexOf($(this).data('contact_id'));
                if (index > -1) {
                	$(this).parent().parent().removeClass('selected')
                    selected_records_contact_ids.splice(index, 1);
                }
            }
            if(selected_records_contact_ids.length > 0){
            	$('.delete-contacts').parent().removeClass('hidden')
            }else{
            	$('.delete-contacts').parent().addClass('hidden')
            }
        })

        $(document).on('change', '.selected-records', function(){
            if($(this).prop('checked')){
            	if (selected_records_ids.indexOf($(this).data('email_id')) == -1){
            		$(this).parent().parent().addClass('selected')
            		selected_records_ids.push($(this).data('email_id'))
            	}
            }else{
            	$('.select_all_move_records').prop('checked', false)
                var index = selected_records_ids.indexOf($(this).data('email_id'));
                if (index > -1) {
                	$(this).parent().parent().removeClass('selected')
                    selected_records_ids.splice(index, 1);
                }
            }
        })

        $(document).on('click', '.edit-contact', function(){
        	odoo.jsonRpc('/edit-contact', 'call', {
        		'contact_id': $(this).data('contact_id')
        	}).then(function(modal){
        		$(modal).appendTo('body').modal().on('hidden.bs.modal', function () {
                	$(this).remove();
                	search_contacts()
                });
        	})
        })

        $(document).on('click', '.unlink-contact', function(){
        	delete_contacts({'contact_ids': [$(this).data('contact_id')]})
        })

        $(document).on('click', '.modal-save-contact', function(){
            if($.trim($(this).closest('.modal-content').find('input[name="first_name"]').val()).length==0 || $.trim($(this).closest('.modal-content').find('input[name="last_name"]').val()).length==0 || $.trim($(this).closest('.modal-content').find('input[name="email_address"]').val()).length==0) {
                alert('Please enter Required Details.')
            }
            else
            {
                var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
                if($.trim($(this).closest('.modal-content').find('input[name="email_address"]').val().match(mailformat))){
                    odoo.jsonRpc('/modal-save-contact', 'call', {
                        'name': $(this).closest('.modal-content').find('input[name="first_name"]').val(),
                        'last_name': $(this).closest('.modal-content').find('input[name="last_name"]').val(),
                        'company_name': $(this).closest('.modal-content').find('input[name="company_name"]').val(),
                        'email_address': $(this).closest('.modal-content').find('input[name="email_address"]').val(),
                        'contact_id': $(this).data('contact_id')
                    }).then(function(modal){
                        $("#edit-contact-modal-sm .close").click();
                        search_contacts()
                    })
                } else {
                    alert("Please enter valid email address.")
                }
            }
        })

        function delete_contacts(data){
        	odoo.jsonRpc('/delete-contacts', 'call', data).then(function(modal){
    			search_contacts()
        	})
        }

        $(document).on('click', '.delete-contacts', function(){
        	delete_contacts({'contact_ids': selected_records_contact_ids})
        })

        function move_records(records_ids, view_type,destination_folder, source_folder){
            if(records_ids.length == 0)
                alert('Please choose records.');
            else if(!destination_folder)
                alert('Please choose destination folder.');
            else if(!source_folder)
                alert('Please choose source folder.');
            else if(destination_folder == source_folder)
                alert('Please choose different destination folder.');
            else{
                ajaxindicatorstart('Please wait...')
                odoo.jsonRpc('/move-records', 'call', {
                    'email_ids': records_ids,
                    'current_folder': source_folder,
                    'destination_folder': destination_folder,
                    'account_id': account_id
                }).then(function(modal){
                    if (view_type == 'list') {
                        $.each(records_ids, function(key,value) {
                            $('input[data-email_id="' + value + '"]').parent().parent().remove();
                        });
                    }else{
                        emails({'folder_name': source_folder, 'page': page, 'step': step, 'folder_names': folder_names})
                    }
                ajaxindicatorstop()
                })
            }
        }

        $(document).on('click', '.add_new_line', function(){
        	if($(this).parent().parent().is(':last-child')){
        		odoo.jsonRpc('/add_new_line', 'call', {}).then(function(data){
            		$('.multiple_lines').append(data)
            	})
        	}
        	if ($(this).hasClass('and')){
        		$(this).parent().find('b.or').replaceWith("<a class='add_new_line or' href='#'>or</a>")
        		$(this).replaceWith('<b class="and">and</b>')
        	}else{
        		$(this).parent().find('b.and').replaceWith("<a class='add_new_line and' href='#'>and</a>")
        		$(this).replaceWith('<b class="or">or</b>')
        	}
        })

        $(document).on('click', '.remove_line', function(){
        	var prev_row = $(this).parent().parent().prev()
        	$(this).parent().parent().remove();
        	if(prev_row.is(':last-child')){
        		prev_row.find('b.or').replaceWith("<a class='add_new_line or' href='#'>or</a>");
        		prev_row.find('b.and').replaceWith("<a class='add_new_line and' href='#'>and</a>");
        	}
        })
        
        $(document).on('click', '.checktab', function(){
        	if($($(this).parent().parent().children().children().children()[2]).hasClass('active'))
    		{
        		$(".advance-search-query").click()
    		}
        	else
        	{
        		$(".search-btn").click()
        	}
        })
        
        var folder_ids = []
        $(document).on('click', '.advance-search-query', function(){
            var error = 0
            var errot_dt = 0
            var error_size = 0

            if ($.trim($('.search_query_require').val()).length === 0){
                error++;
            }
            if(new Date($('input[name="date_to"]').val()) < new Date($('input[name="date_from"]').val())){
                errot_dt++;
            }
            if(isNaN($('input[name="min_attachment_size"]').val()) || $('input[name="min_attachment_size"]').val() < 0 || isNaN($('input[name="max_attachment_size"]').val()) || $('input[name="max_attachment_size"]').val() < 0){
                error_size++;
            }

            if (error > 0 ){
                $('.search_query_require').addClass('val-error')
                return false;
            } else {
                $('.search_query_require').removeClass('val-error')
            }

            if (errot_dt > 0 ){
                $('input[name="date_to"]').addClass('val-error')
                $('input[name="date_from"]').addClass('val-error')
                return false;
            } else {
                $('input[name="date_to"]').removeClass('val-error')
                $('input[name="date_from"]').removeClass('val-error')
            }
            if(error_size > 0){
                $('input[name="min_attachment_size"]').addClass('val-error')
                $('input[name="max_attachment_size"]').addClass('val-error')
            } else {
                $('input[name="min_attachment_size"]').removeClass('val-error')
                $('input[name="max_attachment_size"]').removeClass('val-error')
            }

            if (error <= 0 && errot_dt <= 0 && error_size <= 0){
                ajaxindicatorstart('Please wait...')
                var lines = [];
                var search_query = {
                    'lines': lines,
                    'folder_name': $('input[name="adv_folder_name"]').val(),
                    'read_unread': $('select[name="read_unread"]').val(),
                    'flagged': $('select[name="flagged"]').val(),
                    'has_attachment': $('select[name="has_attachment"]').val(),
                    'min': [$('input[name="min_attachment_size"]').val(), $('select[name="min_attachment_size_type"]').val()],
                    'max': [$('input[name="max_attachment_size"]').val(), $('select[name="max_attachment_size_type"]').val()],
                    'date_from':  $('input[name="date_from"]').val(),
                    'date_to': $('input[name="date_to"]').val(),
                    'account_id': account_id
                }
                $('.multiple_lines .row').each(function(){
                    var line = {
                        'field': $(this).find('select[name="fields"]').val(),
                        'type': $(this).find('select[name="type"]').val(),
                        'query': $(this).find('input[name="query"]').val()
                    }
                    if($(this).find('.add_new_line.and').length && $(this).find('.add_new_line.or').length){
                        line['and_or'] = 'none'
                    }else if($(this).find('.add_new_line.or').length){
                        line['and_or'] = 'and'
                    }else if($(this).find('.add_new_line.and').length){
                        line['and_or'] = 'or'
                    }
                    lines.push(line)
                })
                odoo.jsonRpc('/advance-search-data', 'call', search_query).then(function(data){
                    folder_ids = data['ids_of_folders']
                    $('.content_first').html(data['html_data'])
                    $('.content_first').parent().css('height', $('.content_first').children().height() + 115)
                }).then(function(){
                    ajaxindicatorstop()
                    lines = []
                    $('select[name="fields"]').val('all_field')
                    $('select[name="type"]').val('')
                    $('input[name="query"]').val('')
                    $('input[name="adv_folder_name"]').val('')
                    $('select[name="read_unread"]').val('dont_care')
                    $('select[name="flagged"]').val('dont_care')
                    $('select[name="has_attachment"]').val('dont_care')
                    $('input[name="min_attachment_size"]').val('0')
                    $('select[name="min_attachment_size_type"]').val('kb')
                    $('input[name="max_attachment_size"]').val('1024')
                    $('select[name="max_attachment_size_type"]').val('kb')
                    $('input[name="date_from"]').val('')
                    $('input[name="date_to"]').val('')
                    $('#s2id_autogen1').find('.select2-search-choice').each(function(aa){
                         $(".select2-search-choice-close").click()
                    });
                    $('.advance-search-lg-modal').modal('hide');
                    $('.search-mail-content-custom').css('max-height', $(window).height() - 80).css('min-height', $(window).height() - 80)
                    $('.search-mail-content-custom .empty-view').css('height', $(window).height() - 90).css('line-height', 40)
                    $('.folders li.active').removeClass('active');
                })
            }
        	
        })

        $(document).on('click', '.open-search-record', function(e){
        	var self = this;
        	ajaxindicatorstart('Please wait...')
        	odoo.jsonRpc('/open-search-record', 'call', {'account_id': account_id, 'email_id': $(this).data('email_id'), 'folder_name': $(this).data('folder_name')}).then(function(data){
        		$('.show-search-email').html(data)
        	}).then(function(){
        		$('base').remove();
        		$(self).parent().find('tr').removeClass('active')
        		$(self).addClass('active')
        		ajaxindicatorstop()
        	})
        })

        $(document).on('click', '.move-records', function(){
            move_records(selected_records_ids, 'list', $('select[name="folder_names"]').val(), $('.folders li.active a').data('folder_name'))
        });

        $(document).on('click', '.move-records-form-view', function(){
            move_records([$(this).data('email_id')], 'form',$('select[name="folders_names_in_form"]').val(), $(this).data('folder_name'))
        });

        function open_record(email_id){
            if ($('.folders li.active a').data('folder_name') === "Email_Templates"){
                var url = "/web_emails/compose_mail?account_id=" + account_id + "&template_id=" + email_id + "&email_id=" + email_id + "&folder_name=" + $('.folders li.active a').data('folder_name')
                var reply_to_all = ''
                if ($('input[data-email_id="' + email_id + '"]').data('reply_to_all_emails')){
                    reply_to_all = $('input[data-email_id="' + email_id + '"]').data('reply_to_all_emails')
                }
                var reply_to = ''
                if ($('input[data-email_id="' + email_id + '"]').data('reply_to')){
                	reply_to = $('input[data-email_id="' + email_id + '"]').data('reply_to')
                }
                url +='&reply_to=' + reply_to + '&reply_to_all_emails=' + reply_to_all
                if (GetURLParameter('partner_id')){
                    url += '&partner_id=' + GetURLParameter('partner_id')
                }
                window.open(url)
            } else if($('.folders li.active a').data('folder_name') ==="[Gmail]/Drafts"){
                open_new_window({'mail_type': 'send_draft'}, [email_id],'[Gmail]/Drafts');
            } else if($('.folders li.active a').data('folder_name') ==="Draft"){
                open_new_window({'mail_type': 'send_draft'}, [email_id],'Draft');
            } else {
                window.history.pushState($('.folders li.active a').data('folder_name'), "Folder", "/web_emails/open_record?account_id=" + account_id + "&folder_name=" + $('.folders li.active a').data('folder_name') + '&email_id=' + email_id);
                ajaxindicatorstart('Please wait...')
                var view = {'account_id': account_id,'email_id': email_id, 'folder_name': $('.folders li.active a').data('folder_name'), 'email_ids': email_ids, 'folder_names': folder_names}
                if ($('input[name="search"]').val()){
                    view['search'] = $('input[name="search"]').val()
                }
                odoo.jsonRpc('/open-record', 'call', view).then(function(data){
                    if(data == false){
                        emails({'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})
                    }
                    $('.content_first').html(data)
                    $('.content_first').parent().css('height', $('.content_first').children().height() + 115)
                    odoo.jsonRpc('/update_record_status', 'call', {'flags':'+FLAGS', 'type':'seen_unseen', 'email_id': email_id, 'account_id': account_id, 'folder_name': $('.folders li.active a').data('folder_name')});
                }).then(function(){
                    ajaxindicatorstop()
                    $('base').remove();
                });
            }
        }

        $(document).on('click', '.email_record', function(){
            open_record($(this).data('email_id'))
        })

        $(document).on('click', '.traverse-button', function(){
            open_record($(this).data('email_id'))
        })

        function compose_mail(view){
        	view['account_id'] = account_id;
        	ajaxindicatorstart('Please wait...')
        	$('body').addClass('sidebar-collapse');
            odoo.jsonRpc('/compose-mail', 'call', view).then(function(data){
                $('.content_first').html(data['html_data'])
                if (data['attachments']){
                	var attach_list = $('.attach_list')
                    for (var i = 0; i < data['attachments'].length; i++){
                		var file_name = data['attachments'][i][0][0];
                		var file_type = data['attachments'][i][0][2];
                		var file_data = 'data:'+ file_type + 'base64,' + data["attachments"][i][1];
                        x++;
                        var panel = '<div class="box" id="panel_'+x+'"><div class="box-header with-border"><h3 class="truncate">'+file_name+'</h3><div class="box-tools pull-right">'
                        +'<button class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-minus"></i></button>'
                        +'<button class="btn btn-box-tool attach_remove" data-widget="remove"><i class="fa fa-times"></i></button></div></div>'
                        +'<div class="box-body" align="center"></div></div>'
                        var str = '<div class="col-md-2 attach_file" file_data="" file_type="'+file_type+'" file_name="'+file_name+'">'+panel+'</div>';
                        attach_list.append(str);
                        var preview = null;
                        if(file_type.match("image.*") || file_type.match(/\.(gif|png|jpe?g)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file_name+'" src="'+ file_data +'"/><br/>';
                        }
                        else if(file_type.match("application/pdf") || file_type.match(/\.(pdf)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file_name+'" src="/web/static/src/img/mimetypes/pdf.png"/><br/>';
                        }
                        else if(file_type.match("text/html") || file_type.match(/\.(htm|html)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file_name+'" src="/web/static/src/img/mimetypes/html.png"/><br/>';
                        }
                        else if(file_type.match("text.*") || file_type.match(/\.(xml|javascript)$/i) || file_type.match(/\.(txt|md|csv|nfo|ini|json|py|php|js|css)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file_name+'" src="/web/static/src/img/mimetypes/text.png"/><br/>';
                        }
                        else if(file_type.match("video.*") || file_type.match(/(ogg|mp4|mp?g|webm|3gp)$/i) || file_type.match(/\.(og?|mp4|webm|mp?g|3gp)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file_name+'" src="/web/static/src/img/mimetypes/video.png"/><br/>';
                        }
                        else if(file_type.match("audio.*") || file_type.match(/(ogg|mp3|mp?g|wav)$/i) || file_type.match(/\.(og?|mp3|mp?g|wav)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file_name+'" src="/web/static/src/img/mimetypes/audio.png"/><br/>';
                        }
                        else if(file_type.match("application/zip") || file_type.match(/\.(zip|tar.gz|rar|gz|tar|7z|zipx)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file_name+'" src="/web/static/src/img/mimetypes/archive.png"/><br/>';
                        }
                        else {
                            preview = '<img class="img-thumbnail" alt="'+file_name+'" src="/web/static/src/img/mimetypes/unknown.png"/><br/>';
                        }
                        $("#panel_"+x+" .box-body").html('<p>'+preview+'</p>');
                        $("#panel_"+x).parent().attr('file_data',file_data);
                    }
                }
                tinymce.remove();
                tinymce.init({
                	  selector: '#compose-textarea',
                	  browser_spellcheck : true,
                	  height: 350,
                	  theme: 'modern',
                	  plugins: [
                	    'advlist autolink lists link image charmap print preview hr anchor pagebreak',
                	    'searchreplace wordcount visualblocks visualchars code fullscreen',
                	    'insertdatetime media nonbreaking save table directionality',
                	    'emoticons template paste textcolor colorpicker textpattern imagetools'
                	  ],
                	  toolbar1: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
                	  toolbar2: 'print preview media | forecolor backcolor emoticons',
                	  image_advtab: true,
                	  templates: [
                	    { title: 'Test template 1', content: 'Test 1' },
                	    { title: 'Test template 2', content: 'Test 2' }
                	  ],
                	  content_css: [
                	    '//fast.fonts.net/cssapi/e6dc9b99-64fe-4292-ad98-6974f93cd2a2.css',
                	    '//www.tinymce.com/css/codepen.min.css'
                	  ]
                	 });
                $('input[name="to"]').select2({
    				allowClear: true,
    				multiple: 'multiple',
    				data: data['contacts'],
    				createSearchChoice:function(term, data) {
                        if ( $(data).filter( function() {
                          return this.text.localeCompare(term)===0;
                        }).length===0) {
                          return {id:term, text:term};
                        }
                    }
    			}).select2('val', [data['reply_to']])
                $('input[name="cc"]').select2({
    				allowClear: true,
    				multiple: 'multiple',
    				data: data['contacts'],
    				createSearchChoice:function(term, data) {
                        if ( $(data).filter( function() {
                          return this.text.localeCompare(term)===0;
                        }).length===0) {
                          return {id:term, text:term};
                        }
                    }
    			}).select2('data', data['reply_to_all_emails'])
    			$('input[name="bcc"]').select2({
    				allowClear: true,
    				multiple: 'multiple',
    				data: data['contacts'],
    				createSearchChoice:function(term, data) {
                        if ( $(data).filter( function() {
                          return this.text.localeCompare(term)===0;
                        }).length===0) {
                          return {id:term, text:term};
                        }
                    }
    			}).select2('data', data['reply_to_all_emails'])
            }).then(function(){
    			ajaxindicatorstop()
    			tinymce.execCommand('mceFocus',false,'#compose-textarea');
    		}).then(function(){
    			$('.content_first').parent().css('height', $('.content_first').children().height() + 315)
    		})
        }

        function printStats(msg)
        {
        	if (msg)
        		console.log(msg);
        	console.log("  Row count:", rowCount);
        	if (stepped)
        		console.log("    Stepped:", stepped);
        	console.log("     Errors:", errorCount);
        	if (errorCount)
        		console.log("First error:", firstError);
        }

        function buildConfig()
        {
        	return {
        		delimiter: ',',
        		step: $('#stream').prop('checked') ? stepFn : undefined,
        		complete: completeFn,
        		error: errorFn,
        	};
        }

        function stepFn(results, parser)
        {
        	stepped++;
        	if (results)
        	{
        		if (results.data)
        			rowCount += results.data.length;
        		if (results.errors)
        		{
        			errorCount += results.errors.length;
        			firstError = firstError || results.errors[0];
        		}
        	}
        }

        function completeFn(results)
        {
        	end = now();

        	if (results && results.errors)
        	{
        		if (results.errors)
        		{
        			errorCount = results.errors.length;
        			firstError = results.errors[0];
        		}
        		if (results.data && results.data.length > 0)
        			rowCount = results.data.length;
        	}

        	printStats("Parse complete");
        	var vals_list = [];
        	if(results['errors'].length == 0){
        		$.each(results['data'], function( key, value ) {
        			  vals_list.push({
        				  'name': value[1],
        				  'last_name': value[3],
        				  'email_address': value[0],
        			  })
        		});
        		odoo.jsonRpc('/import-contacts', 'call', {'vals': vals_list}).then(function(data){
        			search_contacts()
        		})
        	}
        }

        function errorFn(err, file)
        {
        	end = now();
        }

        function now()
        {
        	return typeof window.performance !== 'undefined'
        			? window.performance.now()
        			: 0;
        }


        $(document).on('click', '.import-contacts', function(){
        			stepped = 0;
        			rowCount = 0;
        			errorCount = 0;
        			firstError = undefined;

        			var config = buildConfig();
    				$('#files').parse({
    					config: config,
    					before: function(file, inputElem)
    					{
    						start = now();
    					},
    					error: function(err, file)
    					{
    						firstError = firstError || err;
    						errorCount++;
    					},
    					complete: function()
    					{
    						end = now();
    						printStats("Done with all files");
    					}
    				});

        		});


        $(document).on('click', '.more-actions', function(){
            var action = $(this).parent().parent().find("select[name='more_actions']").val();
            if (action == "view_messages")
                open_new_window({'mail_type': 'view'}, [$(this).data("email_id")], $(this).data("folder_name"));
            else if (action == "reply")
                open_new_window({'mail_type': 'reply'}, [$(this).data("email_id")], $(this).data("folder_name"));
            else if (action == "reply_to_all")
                open_new_window({'mail_type': 'reply_to_all'}, [$(this).data("email_id")], $(this).data("folder_name"));
            else if (action == "forward")
                open_new_window({'mail_type': 'forward'}, [$(this).data("email_id")], $(this).data("folder_name"));
            else if (action == "to_spam")
                move_records([$(this).data("email_id")], 'form', 'Bulk Mail', $(this).data("folder_name"));
            else if (action == "seen")
                odoo.jsonRpc('/update_record_status', 'call', {'flags':'+FLAGS', 'type':'seen_unseen', 'email_id': $(this).data("email_id"), 'account_id': account_id, 'folder_name': $(this).data("folder_name")})
            else if (action == "unseen")
                odoo.jsonRpc('/update_record_status', 'call', {'flags':'-FLAGS', 'type':'seen_unseen', 'email_id': $(this).data("email_id"), 'account_id': account_id, 'folder_name': $(this).data("folder_name")})
            else if (action == "flag")
                odoo.jsonRpc('/update_record_status', 'call', {'flags':'+FLAGS', 'type':'flag_unflag', 'email_id': $(this).data("email_id"), 'account_id': account_id, 'folder_name': $(this).data("folder_name")})
            else if (action == "unflag")
                odoo.jsonRpc('/update_record_status', 'call', {'flags':'-FLAGS', 'type':'flag_unflag', 'email_id': $(this).data("email_id"), 'account_id': account_id, 'folder_name': $(this).data("folder_name")})
            else if (action == "save") {
                save_mail([$(this).data('email_id')], $(this).data('folder_name'));
            }
            else if (action == "print") {
                print_mail([$(this).data('email_id')], $(this).data('folder_name'));
            }
            else if (action == "purge") {
                purge_mail([$(this).data('email_id')], $(this).data('folder_name'));
            }
            else
                alert('Please choose records.');
        });

        $(document).on('click', '.list-more-actions', function(){
            if(selected_records_ids.length == 0)
                alert('Please choose records.');
            else {
                var action = $(this).parent().parent().find("select[name='list_more_actions']").val();
                if (action == "list_view_messages")
                    open_new_window({'mail_type': 'view'}, selected_records_ids, $('.folders li.active a').data('folder_name'));
                else if (action == "list_reply")
                    open_new_window({'mail_type': 'reply'}, selected_records_ids, $('.folders li.active a').data('folder_name'));
                else if (action == "list_reply_to_all")
                    open_new_window({'mail_type': 'reply_to_all'}, selected_records_ids, $('.folders li.active a').data('folder_name'));
                else if (action == "list_forward")
                    open_new_window({'mail_type': 'forward'}, selected_records_ids, $('.folders li.active a').data('folder_name'));
                else if (action == "list_to_spam")
                    move_records(selected_records_ids, 'list','Bulk Mail', $('.folders li.active a').data('folder_name'));
                else if (action == "list_seen")
                    list_flags('+FLAGS',selected_records_ids,'seen_unseen');
                else if (action == "list_unseen")
                    list_flags('-FLAGS',selected_records_ids,'seen_unseen');
                else if (action == "list_flag")
                    list_flags('+FLAGS',selected_records_ids,'flag_unflag');
                else if (action == "list_unflag")
                    list_flags('-FLAGS',selected_records_ids,'flag_unflag');
                else if (action == "list_save")
                    save_mail(selected_records_ids, $('.folders li.active a').data('folder_name'));
                else if (action == "list_print")
                    print_mail(selected_records_ids, $('.folders li.active a').data('folder_name'));
                else if (action == "list_purge")
                    purge_mail(selected_records_ids, $('.folders li.active a').data('folder_name'));
                else
                    alert("Please select any valid action!");
            }
        });

        function list_flags(flags,email_ids,type) {
            if(email_ids.length > 0) {
                odoo.jsonRpc('/update_record_status', 'call', {'flags':flags, 'type':type, 'email_id': email_ids, 'account_id': account_id, 'folder_name': $('.folders li.active a').data('folder_name')});
                $.each(email_ids, function(key,value) {
                    if (flags == '-FLAGS') {
                        if (type == 'seen_unseen')
                            $('input[data-email_id="' + value + '"]').parent().parent().addClass('unread_mail');
                        else if (type == 'flag_unflag')
                            $('i[data-email_id="' + value + '_flag"]').addClass('hidden');
                    }
                    else if (flags == '+FLAGS') {
                        if (type == 'seen_unseen')
                            $('input[data-email_id="' + value + '"]').parent().parent().removeClass('unread_mail');
                        else if (type == 'flag_unflag')
                            $('i[data-email_id="' + value + '_flag"]').removeClass('hidden');
                    }
                });
            }
        }

        function save_mail(email_id, folder_name){
            ajaxindicatorstart('Please wait...')
            odoo.jsonRpc('/save-mail', 'call', {
                'account_id': account_id,
                'folder_name': folder_name,
                'email_id': email_id,
            }).then(function(val){
                $.each(val['files'], function (key,data){
                    $('body').append('<a download="'+ data['subject'] +'" id="print-mail" target="_blank" href="data:text/eml;base64,'+ data['file_data'] +'"/>');
                    $('#print-mail')[0].click();
                    $('#print-mail').remove();
                });
            }).then(function(){
                ajaxindicatorstop()
            });
        }

        function print_mail(email_ids, folder_name){
            ajaxindicatorstart('Please wait...')
            var length_of_selected_records = email_ids.length;
            if(length_of_selected_records > 0){
                function loop(email_ids){
                    $.each(email_ids, function(key,value) {
                        odoo.jsonRpc('/print-mail', 'call', {
                            'account_id': account_id,
                            'folder_name': folder_name,
                            'email_id': value,
                        }).then(function(val){
                            var html = val['str_html'] //'<html><head></head><body>ohai</body></html>';
                            var myWindow = window.open("", "_blank");
                            myWindow.document.write(html);
                        }).then(function(){
                            ajaxindicatorstop()
                        });
                    })
                }
                if (length_of_selected_records > 1){
                    if(confirm('Are you sure you want to open ' + length_of_selected_records + ' windows?')){
                        loop(email_ids);
                    }
                }else{
                    loop(email_ids);
                }
            } else {
                alert('Please choose records.')
            }
        }

        function open_new_window(data, email_ids, folder_name){
            var length_of_selected_records = email_ids.length;
            if(length_of_selected_records > 0){
	            function loop(email_ids){
	            	var reply_to_all = ''
	            	var reply_to = ''

	                $.each(email_ids, function(key,value) {
	                	if ($('input[data-email_id="' + value + '"]').data('reply_to')){
                    		reply_to = $('input[data-email_id="' + value + '"]').data('reply_to')
                    	}
	                    if(data['mail_type'] == 'reply'){
	                        window.open("/web_emails/reply?account_id=" + account_id + "&folder_name=" + folder_name + "&email_id=" + value + '&reply_to=' + reply_to);
	                    }else if(data['mail_type'] == 'reply_to_all'){
	                        if ($('input[data-email_id="' + value + '"]').data('reply_to_all_emails')){
	                            reply_to_all = $('input[data-email_id="' + value + '"]').data('reply_to_all_emails')
	                        }else{
	                            reply_to_all = ''
	                        }
	                        window.open("/web_emails/reply_to_all?account_id=" + account_id + "&folder_name=" + folder_name + "&email_id=" + value + '&reply_to=' + reply_to + '&reply_to_all_emails=' + reply_to_all);
	                    }else if(data['mail_type'] == 'forward'){
	                        window.open("/web_emails/forward?account_id=" + account_id + "&folder_name=" + folder_name + "&email_id=" + value);
	                    }else if(data['mail_type'] == 'view'){
	                        window.open("/web_emails/open_record?account_id=" + account_id + "&folder_name=" + folder_name + "&email_id=" + value);
	                    }else if(data['mail_type'] == 'send_draft'){
	                        window.open("/web_emails/send_draft?account_id=" + account_id + "&folder_name=" + folder_name + "&email_id=" + value);
	                    }
	                });
	            }
            	if (length_of_selected_records > 1){
            		if(confirm('Are you sure you want to open ' + length_of_selected_records + ' windows?')){
            			loop(email_ids);
            		}
            	}else{
            		loop(email_ids);
            	}
        	}
        	else{
        		alert('Please choose records.')
        	}

        }

        $(document).on('click', '.list-view-reply-to', function(){
            open_new_window({'mail_type': 'reply'}, selected_records_ids, $('.folders li.active a').data('folder_name'));
            list_flags('+FLAGS',selected_records_ids,'seen_unseen');
        });

        $(document).on('click', '.list-view-reply-to-all', function(){
            open_new_window({'mail_type': 'reply_to_all'}, selected_records_ids, $('.folders li.active a').data('folder_name'));
            list_flags('+FLAGS',selected_records_ids,'seen_unseen');
        });

        $(document).on('click', '.list-view-forward-to', function(){
            open_new_window({'mail_type': 'forward'}, selected_records_ids, $('.folders li.active a').data('folder_name'))
            list_flags('+FLAGS',selected_records_ids,'seen_unseen');
        });

        $(document).on('click', '.reply-to', function(){
            open_new_window({'mail_type': 'reply'}, [$(this).data("email_id")], $(this).data("folder_name"));
        })

        $(document).on('click', '.reply-to-all', function(){
            open_new_window({'mail_type': 'reply_to_all'}, [$(this).data("email_id")], $(this).data("folder_name"));
        })

        $(document).on('click', '.forward-to', function(){
            open_new_window({'mail_type': 'forward'}, [$(this).data("email_id")], $(this).data("folder_name"));
        })

         $(document).on('click', '.discard', function(){
        	if (!($('.folders li.active').length > 0)){
        		$('.folders li:first').addClass('active');
        	}
        	emails({'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})
        })

        $(document).on('keyup', 'input[name="contact_search_query"]', function(){
        	odoo.jsonRpc('/contact_search_query', 'call', {'search_query': $(this).val()}).then(function(data){
        		$('.display_contacts').html(data)
        	})
        })


        $(document).on('click', '.compose-mail-from-contact', function(){
        	var url = "/web_emails/compose_mail?account_id=" + account_id
    		if ($(this).data('contact_id')){
    			url += '&contact_id=' + $(this).data('contact_id')
    		}
        	window.open(url)
        })

        function GetURLParameter(sParam){
            var sPageURL = window.location.search.substring(1);
            var sURLVariables = sPageURL.split('&');
            for (var i = 0; i < sURLVariables.length; i++)
            {
                var sParameterName = sURLVariables[i].split('=');
                if (sParameterName[0] == sParam)
                {
                    return decodeURIComponent(sParameterName[1]);
                }
            }
        }

        $(document).on('click', '.new-compose-mail', function(){
        	var url = "/web_emails/compose_mail?account_id=" + account_id
    		if (GetURLParameter('partner_id')){
    			url += '&partner_id=' + GetURLParameter('partner_id')
    		}
        	window.open(url)
        })

        $(document).on('click', '.delete-button', function(){
        	var self = this;
            ajaxindicatorstart('Please wait...')
            odoo.jsonRpc('/move-records', 'call', {
                'email_ids': [$(self ).data('email_id')],
                'current_folder': $(self ).data('folder_name'),
                'destination_folder': 'Trash',
                'account_id': account_id
            }).then(function (){
                emails({'folder_name': $(self).data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names});
            }).then(function(){
                ajaxindicatorstop()
            });
        })

        $(document).on('click', '.list-view-delete-button', function(){
        	if (selected_records_ids.length != 0){
        		move_records(selected_records_ids, 'list', 'Trash', $('.folders li.active a').data('folder_name'));
        	} else {
        	    alert('Please choose records.')
        	}
        })

        $(document).on('click', '.mark-as-spam', function(){
        	move_records([$(this).data('email_id')], 'form', 'Bulk Mail', $(this).data('folder_name'))
        })


        $(document).on('click', '.list-view-mark-as-spam', function(){
        	if (selected_records_ids.length != 0){
        		move_records(selected_records_ids, 'list', 'Bulk Mail', $('.folders li.active a').data('folder_name'))
        	} else {
        	    alert('Please choose records.')
        	}
        })

        function purge_mail(email_ids, folder_name){
            ajaxindicatorstart('Please wait...');
            odoo.jsonRpc('/delete_mail', 'call', {'email_ids': email_ids,'account_id': account_id, 'folder_name': folder_name}).then(function(){
                emails({'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names});
            }).then(function(){
                ajaxindicatorstop();
                emails({'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})
            });
        }

        $(document).on('click', '.purge-button', function(){
            purge_mail([$(this).data('email_id')], $('.folders li.active a').data('folder_name'));
        })

        $(document).on('click', '.list-purge-button', function(){
            if (selected_records_ids.length != 0){
                purge_mail(selected_records_ids, $('.folders li.active a').data('folder_name'));
            } else {
                alert('Please choose records.')
            }
        })

        $(document).on('click', '.print-button', function(){
            print_mail([$(this).data('email_id')], $(this).data('folder_name'));
        });

        $(document).on('click', '.attach_remove', function(){
            $(".attach-button").prop('disabled', false);
            $(this).parent().parent().parent().parent().remove();
            x--;
        });

        var x = 0;
        $(document).on('click', '.attach-button', function(){
            $(".attach").click();
        });

        $(document).on('change', '.attach', function(){
            var file = this.files[0];
            var attach_list = $('.attach_list')
            if (file){
                if(file.size > (25 * 1024 * 1024)){
                    alert("Sorry file is to large, Gmail does not support files larger than 25mb.")
                    $(".attach").val('');
                } else {
                    x++;
                    $(".attach-button").prop('disabled', true);
                    var reader = new FileReader();
                    var panel = '<div class="box" id="panel_'+x+'"><div class="box-header with-border"><h3 class="truncate">'+file.name+'</h3><div class="box-tools pull-right">'
                    +'<button class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-minus"></i></button>'
                    +'<button class="btn btn-box-tool attach_remove" data-widget="remove"><i class="fa fa-times"></i></button></div></div>'
                    +'<div class="box-body" align="center"></div></div>'
                    var str = '<div class="col-md-2 attach_file" file_data="" file_type="'+file.type+'" file_name="'+file.name+'">'+panel+'</div>';
                    attach_list.append(str);
                    var progress = new CircularProgress({
                        radius: 40,
                        strokeStyle: 'green',
                        lineCap: 'round',
                        lineWidth: 5
                    });
                    $("#panel_"+x+" .box-body").append(progress.el);
                    reader.onprogress = function(data) {
                        if (data.lengthComputable) {
                            var percentComplete = Math.round(data.loaded * 100 / data.total);
                            progress.update(percentComplete);
                        }
                    }
                    reader.onload = function(e) {
                        $(".attach-button").prop('disabled', false);
                        var preview = null;
                        if(file.type.match("image.*") || file.type.match(/\.(gif|png|jpe?g)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file.name+'" src="' + e.target.result + '"/><br/>';
                        }
                        else if(file.type.match("application/pdf") || file.type.match(/\.(pdf)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file.name+'" src="/web/static/src/img/mimetypes/pdf.png"/><br/>';
                        }
                        else if(file.type.match("text/html") || file.type.match(/\.(htm|html)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file.name+'" src="/web/static/src/img/mimetypes/html.png"/><br/>';
                        }
                        else if(file.type.match("text.*") || file.type.match(/\.(xml|javascript)$/i) || file.type.match(/\.(txt|md|csv|nfo|ini|json|py|php|js|css)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file.name+'" src="/web/static/src/img/mimetypes/text.png"/><br/>';
                        }
                        else if(file.type.match("video.*") || file.type.match(/(ogg|mp4|mp?g|webm|3gp)$/i) || file.type.match(/\.(og?|mp4|webm|mp?g|3gp)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file.name+'" src="/web/static/src/img/mimetypes/video.png"/><br/>';
                        }
                        else if(file.type.match("audio.*") || file.type.match(/(ogg|mp3|mp?g|wav)$/i) || file.type.match(/\.(og?|mp3|mp?g|wav)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file.name+'" src="/web/static/src/img/mimetypes/audio.png"/><br/>';
                        }
                        else if(file.type.match("application/zip") || file.type.match(/\.(zip|tar.gz|rar|gz|tar|7z|zipx)$/i)){
                            preview = '<img class="img-thumbnail" alt="'+file.name+'" src="/web/static/src/img/mimetypes/archive.png"/><br/>';
                        }
                        else {
                            preview = '<img class="img-thumbnail" alt="'+file.name+'" src="/web/static/src/img/mimetypes/unknown.png"/><br/>';
                        }
                        $("#panel_"+x+" .box-body").html('<p>'+preview+'</p>');
                        $("#panel_"+x).parent().attr('file_data',e.target.result);
                        $('.content_first').parent().css('height', $('.content_first').children().height() + 175)
                    };
                    reader.readAsDataURL(file);
                }
            }
        });

        $(document).on('click', '.draft-button', function(){
        	ajaxindicatorstart('Please wait...')
            var self = this;
            odoo.jsonRpc('/draft', 'call', {
                'subject': $('input[name="subject"]').val(),
                'to': $('input[name="to"]').val(),
                'cc': $('input[name="cc"]').val(),
                'bcc': $('input[name="bcc"]').val(),
                'body': tinymce.get('compose-textarea').getContent(),
            }).then(function(data){
                if ($(self).data('email_id')){
                    open_record($(self).data('email_id'))
                }else{
                    $('.folders li:first').addClass('active');
                    emails({'folder_name': $('.folders li.active a').data('folder_name'), 'page': page, 'step': step, 'folder_names': folder_names})
                }
            }).then(function(){
    			ajaxindicatorstop()
    		})
        })

        
        
        
        $(document).on('click', '.save-template', function(){
            var self = this;
            var inputValue = prompt("Please enter template name");
          ajaxindicatorstart('Please wait...')
          odoo.jsonRpc('/save-template', 'call', {
              'template_name': inputValue,
              'subject': $('input[name="subject"]').val(),
              'to': $('input[name="to"]').val(),
              'cc': $('input[name="cc"]').val(),
              'bcc': $('input[name="bcc"]').val(),
              'body': tinymce.get('compose-textarea').getContent(),
              'account_id': account_id
          }).then(function(data){
          }).then(function(){
              window.close()
              ajaxindicatorstop()
          });
        });

        function send_mail(self, attach_list){
            ajaxindicatorstart('Please wait...')
            data = {
                'email_id': $(self).data('email_id'),
                'folder_name': $('.folders li.active a').data('folder_name'),
                'body': tinymce.get('compose-textarea').getContent(),
                'subject': $('input[name="subject"]').val(),
                'bcc': $('input[name="bcc"]').val(),
                'cc': $('input[name="cc"]').val(),
                'to': $('input[name="to"]').val(),
                'mail_type': $(self).data('mail_type'),
                'partner_id': $(self).data('partner_id'),
                'attach_list': attach_list,
                'account_id': account_id,
            }
            if ($(self).data('send_delete') == true) {
                data['send_and_delete'] = 'True';
                data['move_to'] = 'Trash';
            }
            if ($(self).data('send_move') == true) {
                data['send_and_move'] = 'True';
                data['move_to'] = $(self).parent().parent().find('select').val();
            }
            odoo.jsonRpc('/send-mail', 'call', data).then(function (){window.close();});
        }

        $(document).on('click', '.create-folder', function(){
            if($.trim($('#folder_name').val()).length==0){
                alert("You must enter folder name to create new folder.")
            } else {
                ajaxindicatorstart('Please wait...')
                odoo.jsonRpc('/create-folder', 'call', {'account_id': account_id, 'new_folder_name': $('#folder_name').val(),'parent_folder':$('.folders li.active a').data('folder_name')}).then(function(data){
                    window.open('/web_emails','_self');
                })
            }
        })
        
        $(document).on('click', '.del-folder', function(){
            ajaxindicatorstart('Please wait...')
        	odoo.jsonRpc('/delete_folder', 'call',{
        			'account_id': account_id,
        			'folder_name': $('#fd_name').val()
        	}).then(function(data){
        	    $('.delete-folder-modal-sm').modal('hide');
                ajaxindicatorstop()
        	    if(data == "ok") {
                    window.open('/web_emails','_self');
        	    } else {
        	        alert("Sorry! This folder can not be deleted.")
        	    }
        	})
        })
        $(document).on('click', '.rnm-folder', function(){
            if($.trim($('#modified_folder_name').val()).length==0){
                alert("You must enter new folder name to rename the folder.")
            } else {
                ajaxindicatorstart('Please wait...')
                odoo.jsonRpc('/rename_folder', 'call',{
                        'account_id': account_id,
                        'folder_name': $('#main_folder_name').val(),
                        'new_name':$('#modified_folder_name').val()
                }).then(function(data){
                    $('.rename-folder-modal-sm').modal('hide');
                    window.open('/web_emails','_self');
                })
            }
        })
        function create_contact(data , contract_el = false){
            ajaxindicatorstart('Please wait...')
            odoo.jsonRpc('/create-contact', 'call', data).then(function(res){
                if(res){
                    if(contract_el){
                        $("#addd-new-contact-modal-sm .close").click();
                        $(contract_el).closest('.modal-content').find('input[name="first_name"]').val('');
                        $(contract_el).closest('.modal-content').find('input[name="last_name"]').val('');
                        $(contract_el).closest('.modal-content').find('input[name="company_name"]').val('');
                        $(contract_el).closest('.modal-content').find('input[name="email_address"]').val('');
                        $( ".contacts" ).trigger( "click" );
                    }
                    ajaxindicatorstop()
                }
            });
        }

        $(".delete-folder").on('click',function(){	
            var a = document.getElementById("fd_name");
            a.value = $(this).data('folder_name');
        })

        $(".rename-folder").on('click',function(){	
            var a = document.getElementById("main_folder_name");
        	a.value = $(this).data('folder_name');
        })
        $(document).on('click', '.create-contact', function(){
            if($.trim($(this).closest('.modal-content').find('input[name="first_name"]').val()).length==0 || $.trim($(this).closest('.modal-content').find('input[name="last_name"]').val()).length==0 || $.trim($(this).closest('.modal-content').find('input[name="email_address"]').val()).length==0) {
                alert('Please enter Required Details.')
            }
            else
            {
                var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
                if($.trim($(this).closest('.modal-content').find('input[name="email_address"]').val().match(mailformat))){
                    ajaxindicatorstart('Please wait...')
                    var self = this;
                    create_contact({
                        'name': $(this).closest('.modal-content').find('input[name="first_name"]').val(),
                        'last_name': $(this).closest('.modal-content').find('input[name="last_name"]').val(),
                        'company_name': $(this).closest('.modal-content').find('input[name="company_name"]').val(),
                        'email_address': $(this).closest('.modal-content').find('input[name="email_address"]').val(),
                    },self)
                } else {
                    alert("Please enter valid email address.")
                }
    		}
        })

        $(document).on('click', '.add-to-contact-from-form-view', function(){
        	create_contact({
        		'name': $(this).parent().find('span.msg_from_name').text(),
        		'last_name': '',
        		'company_name': '',
        		'email_address': $(this).parent().find('span.msg_from_email').text(),
        	})
        	
        	$(this).remove()
        })

        function search_contacts(){
        	odoo.jsonRpc('/search-contacts', 'call', {}).then(function(data){
        		$('.content_first').html(data)
        		$('.content_first').parent().css('height', $('.content_first').children().height() + 115)
        	})
        }

        $(document).on('click', '.contacts', function(){
        	window.history.pushState('Conatcts', "Conatcts", "/web_emails/contacts?account_id=" + account_id);
        	search_contacts()
        })

    })

})