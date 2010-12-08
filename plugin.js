/*!
* Aloha Editor Midgard integration
* Author & Copyright (c) 2010 The Midgard Project
* dev@lists.midgard-project.org
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * @author bergie
 */
if (typeof midgardproject == 'undefined') {
    midgardproject = {};
}

midgardproject.SavePlugin = new GENTICS.Aloha.Plugin('org.midgardproject.aloha.plugins.Save');

/**
 * Configure the available languages
 */
midgardproject.SavePlugin.languages = ['en'];

/**
 * Holder for Midgard objects (array indexed by GUID) that have been made editable on the page
 */
midgardproject.SavePlugin.objects = {};

/**
 * Initialize the plugin and set initialize flag on true
 */
midgardproject.SavePlugin.init = function () {

    // remember reference to this class for callback
    var that = this;
    
    // create save button to ribbon
    var saveButton = new GENTICS.Aloha.ui.Button({
        label : this.i18n('save'),
        onclick : function() {
            that.save();
        }
    });
        
    // add button to ribbon
    GENTICS.Aloha.Ribbon.addButton(saveButton);
};

/**
 * collect data and save 
 */
midgardproject.SavePlugin.save = function () {

    // iterate all Midgard objects which have been made Aloha editable
    jQuery.each(midgardproject.SavePlugin.objects, function(index, midgardObject) {
        var guid = index;
        var type = midgardObject.type;
        var propertyContents = {};
        var objectModified = false;
        jQuery.each(midgardObject.properties, function(index, alohaInstance) {
            if (alohaInstance.isModified())
            {
                propertyContents[index] = alohaInstance.getContents();
                objectModified = true;
            }
        });

        if (objectModified)
        {
            // Send the edited fields to the form handler backend
            var url = '/mgd:create/save/' + type + '/' + guid;
            jQuery.ajax({
                url: url,
                dataType: 'json',
                data: propertyContents,
                type: 'POST',
                success: function (response) {
                    jQuery.each(midgardObject.properties, function(index, alohaInstance) {
                        alohaInstance.setUnmodified();
                    });
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    try
                    {
                        response = jQuery.parseJSON(xhr.responseText);
                        message = response.status.message;
                    }
                    catch (e)
                    {
                        message = xhr.statusText;
                    }
                    GENTICS.Aloha.Log.error("Midgard saving plugin", message);
                },
            });
        }
    });
} ;
