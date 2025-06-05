$(function () {
    $('#tags-content').hide();
    $('#tags-toggle').css('cursor', 'pointer');
    // Estado inicial: cerrado
    $('#tags-arrow').text('►');
    $('#tags-toggle').click(function () {
        $('#tags-content').slideToggle(200, function() {
            var arrow = $('#tags-arrow');
            if ($('#tags-content').is(':visible')) {
                arrow.text('▼');
            } else {
                arrow.text('►');
            }
        });
    });
});
