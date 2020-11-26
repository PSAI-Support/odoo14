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

var account_id = $('html').data('active_account_id');
var x = 0;
function compose_mail(view){

    var sPageURL = window.location.search.substring(1);
    view['current_url'] = sPageURL;
    view['account_id'] = account_id;
    $.ajax({
        url: '/compose-new-mail',
        dataType: 'json',
        type: 'POST',
        data: view,
    }).done(function( data) {
        $('.content_first').html(data['html_data']);
        if (data['attachments']) {
            var attach_list = $('.attach_list');
            for (var i = 0; i < data['attachments'].length; i++){
                var file_name = data['attachments'][i][0][0];
                var file_type = data['attachments'][i][0][1];
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
            ],
            relative_urls : false,
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
        })

        if (data['reply_to']){
        	$('input[name="to"]').select2('data', data['reply_to']);
        }
        
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
        })
        if(data['reply_to_all_emails']){
        	$('input[name="cc"]').select2('data', data['reply_to_all_emails']);
        }
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
        })
        if(data['bcc_all']){
        	$('input[name="bcc"]').select2('data', data['bcc_all']);
        }
    })
    .fail(function(data) {
        console.log( "error>>>",data );
    })
    .always(function() {
        ajaxindicatorstop()
        tinymce.execCommand('mceFocus',false,'#compose-textarea');
    });
}

function send_mail(self, attach_list){
    ajaxindicatorstart('Please wait...')
    data = {
        'email_id': $(self).data('email_id'),
        'folder_name': $(self).data('folder_name'),
        'body': tinymce.get('compose-textarea').getContent(),
        'subject': $('input[name="subject"]').val(),
        'bcc': $('input[name="bcc"]').val(),
        'cc': $('input[name="cc"]').val(),
        'to': $('input[name="to"]').val(),
        'mail_type': $(self).data('mail_type'),
        'partner_id': $(self).data('partner_id'),
        'attach_list': JSON.stringify(attach_list),
        'account_id': account_id,
    }
    if ($(self).data('send_delete') == true) {
        data['send_and_delete'] = 'True';
        data['move_to'] = 'Trash';
    }
    if ($(self).data('send_move') == true) {
        data['send_and_move'] = 'True';
        data['move_to'] = $('select[name="move_folders_names"]').val();

    }
    $.ajax({
        url: '/send-mail',
        dataType: 'json',
        type: 'POST',
        data: data,
        traditional:true
    })
    .done(function(res) {
        window.close();
    })
    .fail(function(res) {
        console.log( "error>>>",res );
    })
    .always(function() {
        ajaxindicatorstop()
    });
}

$(function(){

    ajaxindicatorstart('Please wait...')
    function GetURLParameter(sParam) {
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

    function GetURLParameterFolder(sParam){
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('=');
        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('&');
            if (sParameterName[0] == sParam)
            {
                return decodeURIComponent(sParameterName[1]);
            }
        }
    }
    
    if (window.location.pathname == '/web_emails/compose_mail') {
    	var data = {'mail_type': 'new'}
        if (GetURLParameter('partner_id'))
            data['partner_id'] = GetURLParameter('partner_id');
        else if (GetURLParameter('contact_id'))
            data['contact_id'] = GetURLParameter('contact_id');
        if (GetURLParameter('email_id'))
            data['email_id'] = GetURLParameter('email_id');
        if (GetURLParameter('folder_name'))
            data['folder_name'] = GetURLParameter('folder_name');
        if (GetURLParameter('template_id'))
            data['template_id'] = GetURLParameter('template_id');
        if (GetURLParameter('reply_to'))
            data['reply_to'] = GetURLParameter('reply_to');
        if (GetURLParameter('reply_to_all_emails'))
            data['reply_to_all_emails'] = GetURLParameter('reply_to_all_emails');
        compose_mail(data)
    }
    if (window.location.pathname == '/web_emails/send_draft') {
    	var data = {'mail_type': 'send_draft'}
        if (GetURLParameter('partner_id'))
            data['partner_id'] = GetURLParameter('partner_id');
        else if (GetURLParameter('contact_id'))
            data['contact_id'] = GetURLParameter('contact_id');
        if (GetURLParameter('email_id'))
            data['email_id'] = GetURLParameter('email_id');
        if (GetURLParameter('folder_name'))
            data['folder_name'] = GetURLParameter('folder_name');
        if (GetURLParameter('template_id'))
            data['template_id'] = GetURLParameter('template_id');
        if (GetURLParameter('reply_to'))
            data['reply_to'] = GetURLParameter('reply_to');
        if (GetURLParameter('reply_to_all_emails'))
            data['reply_to_all_emails'] = GetURLParameter('reply_to_all_emails');
        compose_mail(data)
    }
    if(window.location.pathname == '/web_emails/reply'){
        var folder_name = GetURLParameter('folder_name');
        compose_mail({'email_id': GetURLParameter('email_id'), 'folder_name': folder_name,'reply_to': GetURLParameter('reply_to'), 'mail_type': 'reply'})
    }
    if(window.location.pathname == '/web_emails/forward'){
        var folder_name = GetURLParameter('folder_name');
        compose_mail({'email_id': GetURLParameter('email_id'), 'folder_name': folder_name, 'mail_type': 'forward'})
    }
    if(window.location.pathname == '/web_emails/reply_to_all'){
        var folder_name = GetURLParameter('folder_name');
        compose_mail({'email_id': GetURLParameter('email_id'), 'folder_name': folder_name,'reply_to': GetURLParameter('reply_to'), 'mail_type': 'reply-to-all', 'reply_to_all_emails': GetURLParameter('reply_to_all_emails')})
    }

    if(window.location.pathname == '/web_emails/open_record'){
    }

    $(document).on('click', '.attach_remove', function(){
        //user click on remove attchment
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
    
    $(document).on('click', '.send-button,.send-delete-button,.send-move-button', function() {
        var self = this;
        if($.trim($('input[name="to"]').val()).length==0 && $.trim($('input[name="cc"]').val()).length==0 && $.trim($('input[name="bcc"]').val()).length==0){
            alert("You must enter atleast one recipient")
        } else {
            if($(".attach_file").length == 0){
                send_mail(self, []);
            }else{
                var attach_list = [];
                $(".attach_file").each(function(i) {
                    var obj = {};
                    attach_list.push({'datas':$(this).attr("file_data"), 'name':$(this).attr("file_name"), 'file_type':$(this).attr("mimetype")});
                    if (attach_list.length == $(".attach_file").length){
                        send_mail(self, attach_list);
                    }
                });
            }
        }
    })

    $(document).on('click', '.draft-button', function(){
        ajaxindicatorstart('Please wait...')
        var self = this;
        var attach_list = [];
        $(".attach_file").each(function(i) {
            var obj = {};
            attach_list.push({'datas':$(this).attr("file_data"), 'name':$(this).attr("file_name"), 'file_type':$(this).attr("mimetype")});
        });
        var data = {
                'subject': $('input[name="subject"]').val(),
                'to': $('input[name="to"]').val(),
                'cc': $('input[name="cc"]').val(),
                'bcc': $('input[name="bcc"]').val(),
                'body': tinymce.get('compose-textarea').getContent(),
                'account_id': account_id,
                'save_draft': 'True',
            }
        if (attach_list.length == $(".attach_file").length){
            data['attach_list'] = JSON.stringify(attach_list)
        }
        $.ajax({
            url: '/draft',
            dataType: 'json',
            type: 'POST',
            data: data,
        })
        .done(function(res) {
            window.close();
        })
        .fail(function(res) {
            console.log( "error>>>",res );
        })
        .always(function() {
            ajaxindicatorstop()
        });
    })
    
    
    $(document).on('click', '.save-template', function(){
        var self = this;
        var inputValue = prompt("Please enter template name");
        ajaxindicatorstart('Please wait...')
        var data = {
                'template_name': inputValue,
                'subject': $('input[name="subject"]').val(),
                'to': $('input[name="to"]').val(),
                'cc': $('input[name="cc"]').val(),
                'bcc': $('input[name="bcc"]').val(),
                'body': tinymce.get('compose-textarea').getContent(),
                'account_id': account_id,
                'save_template': 'True'
            }
        $.ajax({
            url: '/save-template',
            dataType: 'json',
            type: 'POST',
            data: data,
        })
        .done(function(res) {
            window.close();
        })
        .fail(function(res) {
            console.log( "error>>>",res );
        })
        .always(function() {
            ajaxindicatorstop()
        });
    });

});