$(window).load(function () {
    $('.loader').fadeOut('slow');
});

jQuery(document).ready(function ($) {

    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 100) {
            $('.scroll-top').fadeIn();
        } else {
            $('.scroll-top').fadeOut();
        }
    });

    $('.scroll-top').on('click', function () {
        $('html, body').animate({
            scrollTop: 0
        }, 600);
        return false;
    });

    // INIT FUNCTIONS
   // $('[data-toggle="tooltip"]').tooltip();

    // EVENTS
    $('.input input').on('focus', function () {
        $(this).parent('.input').addClass('input--filled');
    }).on('blur', function () {
        if ($(this).val().length === 0) {
            $(this).parent('.input').removeClass('input--filled input--correct');
        }
    });

    $('select').on('changed.bs.select', function () {
        var $parent = $(this).parents('.bootstrap-select'),
            $value = $($parent).find('.filter-option').text();

        if ($value != '') {
            $($parent).addClass('active');
        }
        else {
            $($parent).removeClass('active');
        }
    });

    $('.mobile-menu').on('click', function () {
        $('body').toggleClass('open-menu');
        $(this).parents('nav').toggleClass('open');
    });

    $('.mobile-panel').on('click', function () {
        $('.modal').modal('hide');
        $('body').toggleClass('open-panel');
        $(this).append('<div class="panel-overlay"></div>');
        $(this).parents('header').toggleClass('open');
    });

    $('.user-panel__close i').on('click', function () {
        $('body').toggleClass('open-panel');
        $('.panel-overlay').remove();
        $(this).parents('header').toggleClass('open');
    });

    $('.mobile-call').on('click', function () {
        $(this).parents('footer').toggleClass('open');
    });

    $('.box .switch').on('click', function () {
        $(this).parents('.box').toggleClass('box--hide');
    });

    $('.sample i').on('click', function () {
        $(this).parents('.sample').fadeOut();
    });

    $('#additional-address').change(function () {
        $('#address').toggleClass('hidden');
    });

    $('#additional-income').change(function () {
        $('#income').toggleClass('hidden');
    });

    $('.select-options li').on('click', function () {
        var $value = $(this).text(),
            $parent = $(this).parents('ul'),
            $input = $($parent).attr('data-input');

        $($input).parents('.input').addClass('input--filled');
        $($input).val($value);
        $(this).parents('.select').removeClass('open');
    });

    $('.offers-table td').not('.empty, .number').on('click', function () {
        $('.offers-table td').removeClass('active');
        $(this).addClass('active');
    });

    $('[data-step]').on('click', function () {
        var $value = $(this).attr('data-step');
        var $progress = $(this).attr('data-progress');
        var step;

        if ($(this).hasClass('next-btn')) {

        }

        if (Proposal.Run($value)) {
            $(this).parents('.step').hide();
            $($value).fadeIn();
            $('html, body').animate({
                scrollTop: 0
            }, 600);

            if ($progress > 0) {
                $('#progress').find('p').removeClass('hidden');
                $('#progress').find('span').html($progress);
            }
            else {
                $('#progress').find('p').addClass('hidden');
            }

            $('#progress').delay(100).queue(function (next) {
                $(this).css('width', $progress + '%');
                next();
            });
            return false;
        }
    });
});

/*
 *
 *
 * Validate
 * */

function goToUrl(url,newWidow) {
    if(newWidow==true){
        window.open(url, '_blank');
    }else{
        window.location.href = url;
    }
}
//input mask pp
function mask() {


    /*  var inputs = document.querySelectorAll('input');
     Array.prototype.forEach.call(inputs, function (input) {
     if(input.hasAttribute('mask')) {

     input.inputmask($(input).attr('mask'))
     }
     })
     $.each('input', function (i, v) {
     window.console.log(v);
     //if($(v).hasAttribute('mask')){
     //    $(v).inputmask($(v).attr('mask'))
     //}
     })*/
}
mask()

function getAllDictionary(){
    var urlSave=AgentGlobal.url+'getdictionary/getall';
    $.ajax({
            method: "POST",
            url: urlSave,
            data: {},
            async:false
        })
        .done(function( msg ) {
            AgentGlobal.dictionary=msg;
        })
        .fail(function(){
            console.log('blad odczytu','ERROR');
        })
        .always(function() {
            $('.loader').fadeOut('slow');
        })
}

var allSelect={
    0:{'id':'input-property','dictionary':'s_rodzaj_nieruchomosci'},
    1:{'id':'input-owner-property','dictionary':'s_statusy_wlascicielske_lokali'},
    2:{'id':'input-long-residence','dictionary':'s_okres_zamieszkania'},
    3:{'id':'id_stan_cywilny','dictionary':'s_stan_cywilny'},
    4:{'id':'id_medium_wyplaty','dictionary':'s_medium_wyplaty'},
    5:{'id':'id_typu_dochodu','dictionary':'s_typ_dochodu'},
    6:{'id':'id_typu_umowy','dictionary':'s_typ_umowy_czas'},
    7:{'id':'czy_w_okresie_wypowiedzenia','dictionary':'s_tak_nie'},
    8:{'id':'id_typu_dochodu_dodatkowego','dictionary':'s_typ_dochodu'},
    9:{'id':'id_typu_umowy_dochodu_dodatkowego','dictionary':'s_typ_umowy_czas'},
    10:{'id':'czy_w_okresie_wypowiedzenia_dochodu_dodatkowego','dictionary':'s_tak_nie'},
    11:{'id':'id_wyksztalcenie','dictionary':'s_wyksztalcenie'},
};
function loadDictionary() {



    for(var i=0;i<12;i++){
        select = document.getElementById(allSelect[i].id);
        if (typeof(select) != 'undefined' && select != null){
            var opt = document.createElement('option');
            opt.value = '';
            opt.innerHTML = '';
            select.appendChild(opt);

            $(AgentGlobal.dictionary[allSelect[i].dictionary]).each(function (value, name) {

                for (var valueDictionary in name) {
                    if('s_tak_nie'==allSelect[i].dictionary){
                        console.log(name.id);
                        console.log(name.nazwa);
                        console.log(name[valueDictionary].id);
                        console.log(valueDictionary);
                        var opt = document.createElement('option');
                        opt.value =name.id;
                        opt.innerHTML = name.nazwa;
                        select.appendChild(opt);

                    }else{
                        var opt = document.createElement('option');
                        opt.value =name[valueDictionary].id;
                        opt.innerHTML = name[valueDictionary].nazwa;
                        select.appendChild(opt);
                    }

                }
            })
        }

    }

    for (var property in AgentGlobal.dictionary['apiph_oswiadczenia_klienta']) {
        $('#consant').append(
            "<input id='" + AgentGlobal.dictionary['apiph_oswiadczenia_klienta'][property].nazwa +
            "' type='checkbox'" + "name='" + AgentGlobal.dictionary['apiph_oswiadczenia_klienta'][property].nazwa + "'" +
            ">" + "<label for='" + AgentGlobal.dictionary['apiph_oswiadczenia_klienta'][property].nazwa + "'>"
            + AgentGlobal.dictionary['apiph_oswiadczenia_klienta'][property].tresc + "</label>"
        );

    }
}

function sendSMSConsentCode() {

    if (checkPhone($('#input-komorka').val()) && checkPESEL($("#input-pesel").val())) {
        $('.loader').fadeIn('fast');
        $('#miejsce-na-kod-sms').show();
        var urlSave = AgentGlobal.url + 'sendapplication/sendsmsconsentcode';
        $.ajax({
                method: "POST",
                url: urlSave,
                data: {'telefon_komorkowy': $('#input-komorka').val(), 'pesel': $('#input-pesel').val()}
            })
            .done(function (msg) {
                if (msg.status == 1) {
                    alertCs('WysĹano Sms', 'INFO')
                } else {
                    alertCs('BĹÄd wysyĹki sms:' + msg.error, 'ERROR')
                }
            })
            .fail(function () {
                alertCs('blÄd wysyĹki sms');
            })
            .always(function () {
                $('.loader').fadeOut('slow');
            })
        ;
    } else {
        alertCs('BĹÄdny numer telefonu lub pesel', 'ALERT');
    }

}
function checkPESEL(val) {

    var WZ = /^[0-9]{11}$/;
    if ((WZ.test(val))) {
        var suma = 0;
        var wagi = new Array(1, 3, 7, 9, 1, 3, 7, 9, 1, 3)
        for (var q = 0; q < val.length - 1; q++) {
            suma = suma + val[q] * wagi[q]
        }
        suma = suma % 10;
        var wynik = (10 - suma) % 10
        if (wynik == val[10]) {
            return true
        }
        else {
            return false
        }
    }
    else return false;

}
function checkCode(val) {
    var DW = /^[0-9]{4}$/;
    if ((DW.test(val))) {
        return true;
    }
    return false;
}
function checkId(val) {
    var DW = /^[A-Z]{3}[0-9]{6}$/;
    if ((DW.test(val))) {
        var suma = 0;
        var wagi = new Array(7, 3, 1, 0, 7, 3, 1, 7, 3);
        var litery = new Array();
        litery['A'] = 10, litery['B'] = 11, litery['C'] = 12, litery['D'] = 13,
            litery['E'] = 14, litery['F'] = 15, litery['G'] = 16, litery['H'] = 17,
            litery['I'] = 18, litery['J'] = 19, litery['K'] = 20, litery['L'] = 21,
            litery['M'] = 22, litery['N'] = 23, litery['O'] = 24, litery['P'] = 25,
            litery['Q'] = 26, litery['R'] = 27, litery['S'] = 28, litery['T'] = 29,
            litery['U'] = 30, litery['V'] = 31, litery['W'] = 32, litery['X'] = 33,
            litery['Y'] = 34, litery['Z'] = 35

        for (var i = 0; i < 3; i++) {
            suma += wagi[i] * litery[val[i]];
        }
        for (var i = 4; i < 9; i++) {
            suma += wagi[i] * val[i];
        }

        suma = suma % 10;
        var wynik = suma % 10
        if (wynik == val[3])    return true
        else return false
    }
    else return false

}
function checkAcountNumber(nrb) {

    nrb = nrb.replace(/[^0-9]+/g, '');
    var Wagi = new Array(1, 10, 3, 30, 9, 90, 27, 76, 81, 34, 49, 5, 50, 15, 53, 45, 62, 38, 89, 17, 73, 51, 25, 56, 75, 71, 31, 19, 93, 57);
    if (nrb.length == 26) {
        nrb = nrb + "2521";
        nrb = nrb.substr(2) + nrb.substr(0, 2);
        var Z = 0;
        for (var i = 0; i < 30; i++) {
            Z += nrb[29 - i] * Wagi[i];
        }
        if (Z % 97 == 1) {
            return true;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
function checkPhone(val) {
    var RE = /^[0-9]{9}$/;
    return (RE.test(val));
}

function alertCs(text, type) {

    switch (type) {
        case 'INFO': {

            break;
        }
        case 'WARNING': {

            break;
        }
        case 'ALERT': {

            break;
        }
        case 'ERROR': {

            break;
        }
    }
    alert(text);
}
// ============================================================
// INPUT FILE
// ============================================================
function initInputFile() {
    var inputs = document.querySelectorAll('.input-file');
    Array.prototype.forEach.call(inputs, function (input) {
        var label = input.nextElementSibling,
            labelVal = label.innerHTML;

        input.addEventListener('change', function (e) {
            var fileName = '';
            if (this.files && this.files.length > 1)
                fileName = ( this.getAttribute('data-multiple-caption') || '' ).replace('{count}', this.files.length);
            else
                fileName = e.target.value.split('\\').pop();

            if (fileName)
                label.querySelector('span').innerHTML = fileName;
            else
                label.innerHTML = labelVal;
        });

        // Firefox bug fix
        input.addEventListener('focus', function () {
            input.classList.add('has-focus');
        });
        input.addEventListener('blur', function () {
            input.classList.remove('has-focus');
        });
    });
}

// ============================================================
// DECYZJA KREDYTOWA
// ============================================================
function returnCorrectMessage(msg, $element, $result) {
    console.log('status');
    console.log(parseInt(msg.data.status_id));
    switch (parseInt(msg.data.status_id)) {
        case 4:
            $('#result-accept').show();
            $($element).attr('class', 'accept');
            $result = msg.data.status_nazwa;
            break;
        case 3://analiza
        case 2://analiza wstepna
            console.log('result-warning');
            $('#result-warning').show();
            $($element).attr('class', 'warning');
            $result = msg.data.status_nazwa;
            break;
        case 15://lead
            console.log('lead');
            $('#result-lead').show();
            $($element).attr('class', 'warning');
            $result = msg.data.status_nazwa;
            break;
        default: {
            console.log('default');
            $('#result-default').show();
            $($element).attr('class', 'accept');
            $result = msg.data.status_nazwa;
        }
    }
    return $result
}
function initDecision(msg) {

    var $element = $('.modal-body').find('[data-step="step-3"]'),
        $text = $($element).find('b');
    $($text).html('');

    var $result;
    if(msg.status==-100){
        alertCs('BĹÄĂ KRYTYCZNY : '+msgAsunc.error, 'ERROR');
        return false;
    }
    console.log('msg.header.response_code:');
    $status = parseInt(msg.header.response_code);
    console.log($status);
    $($element).attr('class', '');
    $('#result-loader').hide();
    switch ($status) {
        case 301:
            console.log('error');
            $('#result-error').show();
            $($element).attr('class', 'error');
            var errors=msg.header.errors;

            console.log(Object.keys(errors).length)
            if(Object.keys(errors).length==1){
                $('#info-msg').append('<p>' + errors.error + '</p>');
                break;
            }
            $(errors.error).each(function (i, v) {
                $('#info-msg').append('<p>' + v + '</p>');
                console.log(v);
            });
            $result = msg.header.response_message;
            break;
        case 200:
            $result = returnCorrectMessage(msg, $element, $result);
            break;
        default:
            $('#result-error').show();
            $($element).attr('class', 'error');
            $result = msg.header.response_message;
            break;
    }

    $($text).html($result);
}

// ============================================================
// WYĹLIJ WNIOSEK
// ============================================================
function animateSending() {
    copyAddress();



    var $first = $('.modal-body').find('[data-step="step-1"]'),
        $span_1 = $($first).find('span'),
        $text_1 = $($first).find('b'),
        $msg = null,
        $second = $('.modal-body').find('[data-step="step-2"]'),
        $span_2 = $($second).find('span'),
        $text_2 = $($second).find('b');
    $($text_2).html('');
    $($text_1).html('');

    var $corrent_1, $corrent_2;
    $($span_1).css('width','0');
    var $progress = (100 * parseFloat($($span_1).css('width')) / parseFloat($($first).css('width')) );
    $corrent_1 = $progress;
    $corrent_2 = $progress;

    console.log('animateSending');

    function hideMesage() {
        $('#info-msg').html('');
        $($span_1).css('width', 0 + '%');
        $($text_1).html(Math.round(0) + '%');
        $($span_2).css('width', 0 + '%');
        $($text_2).html(Math.round(0) + '%');
        $('#result-error').hide();
        $('#result-warning').hide();
        $('#result-accept').hide();
        $('#result-lead').hide();
        $('#result-default').hide();

        $('.icon-check').remove();
        $('.modal-body').find('[data-step="step-3"]').find('b').html('');
    }
    hideMesage()

    $('#dialog-message').on('hidden.bs.modal', function (e) {
        hideMesage()

    });


    setValueCheckbox();

    function updateProgress() {
        var $max_1 = 3;
        var $max_2 = 15;
        var $add_1 = 1.67 / $max_1;
        var $add_2 = 1.67 / $max_2;

        if ($corrent_1 < 100) {
            $corrent_1 += $add_1;
            $($span_1).css('width', $corrent_1 + '%');
            $($text_1).html(Math.round($corrent_1) + '%');
            setTimeout(updateProgress, 50);
        }
        if($msg != null && typeof( $msg.status) != 'undefined' &&  $msg.status==-100){
            alertCs('BĹÄĂ KRYTYCZNY : '+$msg.error, 'ERROR');
            return false;
        }
        if ($corrent_1 > 99) {
            $($text_1).html('<i class="icon-check"></i>');

            if($msg!==null){
                $corrent_2=100;
                $($span_2).css('width', $corrent_2 + '%');
                $($text_2).html(Math.round($corrent_2) + '%');
                $($text_2).html('<i class="icon-check"></i>');
                initDecision($msg);
                return true;
            }
            if ($corrent_2 < 100) {
                $corrent_2 += $add_2;
                $($span_2).css('width', $corrent_2 + '%');
                $($text_2).html(Math.round($corrent_2) + '%');
                setTimeout(updateProgress, 50);
            }
            if ($corrent_2 > 98) {
                $($text_2).html('<i class="icon-check"></i>');
            }
            if (parseInt($corrent_2) == 98) {
                $('#result-warning').show();
                $($element).attr('class', 'error');
                $result = 'Przekroczony czas wysyĹki ';
                $($text).html($result);
                return false;
            }
        }
    }

    updateProgress();
    var urlSave = AgentGlobal.url + 'sendapplication/send/id_wniosku/'+$('#id').val(),
        dataSerialize = $("#form-all-steps").serialize();
    $.ajax({
            method: "POST",
            url: urlSave,
            data: dataSerialize,
            async: false
        })
        .done(function (msgAsunc) {
            if(msgAsunc.status==-100){
                alertCs('BĹÄĂ KRYTYCZNY : '+msgAsunc.error, 'ERROR');
                return false;
            }
            $msg=msgAsunc;
        })
        .fail(function () {
            alertCs('blad zapisu', 'ERROR');
        })
        .always(function () {
            $('.loader').fadeOut('slow');
        })
    ;

}

function loadProposal() {

    if (typeof(proposal) != 'undefined' && proposal != null) {
        for (var property in proposal) {
            if(proposal[property]!='0000-00-00' && proposal[property]!=0){
                $('[name=' + property + ']').val(proposal[property]).change();
            }
        }
        $('input:checkbox').each(function (i, v) {
            var result = (parseInt(proposal[$('#' + v.id).attr('name')]));
            $('[name=' + $('#' + v.id).attr('name') + ']').attr('checked', Boolean(result));
        })
    }
}

function setValueCheckbox() {

    $('input:checkbox').each(function (i, v) {
        if ($(v).is(':checked')) {
            $(v).val(1);
        } else {
            $(v).val(0);
        }
    })

}

function checkInputValue() {
    $('.input__field').each(function () {
        if ($(this).val().length != 0) {
            $(this).parent('.input').addClass('input--filled');
        }
    });

    $('.bootstrap-select').each(function () {
        $(this).addClass('active');
    });
}