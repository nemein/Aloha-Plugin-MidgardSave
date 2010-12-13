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

midgardproject.SavePlugin.enablerButton = {};
midgardproject.SavePlugin.disablerButton = {};

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

    midgardproject.SavePlugin.enablerButton = new GENTICS.Aloha.ui.Button({
        label : this.i18n('enable editing'),
        onclick : function() {
            that.enableEditables();
        }
    });

    midgardproject.SavePlugin.disablerButton = new GENTICS.Aloha.ui.Button({
        label : this.i18n('disable editing'),
        onclick : function() {
            that.disableEditables();
        }
    });
    midgardproject.SavePlugin.disablerButton.hide();
        
    // add buttons to ribbon
    GENTICS.Aloha.Ribbon.addButton(midgardproject.SavePlugin.enablerButton);
    GENTICS.Aloha.Ribbon.addButton(midgardproject.SavePlugin.disablerButton);
    GENTICS.Aloha.Ribbon.addButton(saveButton);
};

midgardproject.SavePlugin.enableEditables = function() {
    var objectcontainers = jQuery('[typeof]');
    jQuery.each(objectcontainers, function(index, objectinstance)
    {
        var objectinstance = jQuery(objectinstance);
        var children = jQuery('*', objectinstance).filter(function() {
            return jQuery(this).attr('property'); 
        });
        var guid = objectinstance.attr('about');
        if (!guid)
        {
            return true;
        }
        var type = objectinstance.attr('typeof');
        console.log(type + " " + guid);
        
        if (typeof midgardproject.SavePlugin.objects[guid] == "undefined") {
            midgardproject.SavePlugin.objects[guid] = {};
        }

        midgardproject.SavePlugin.objects[guid].type = type;
        midgardproject.SavePlugin.objects[guid].element = objectinstance;
        midgardproject.SavePlugin.objects[guid].properties = {};

        jQuery.each(children, function(index, childInstance)
        {
            var childInstance = jQuery(childInstance);
            var propertyName = childInstance.attr('property');
            midgardproject.SavePlugin.objects[guid].properties[propertyName] = {
                element: childInstance,
                aloha: new GENTICS.Aloha.Editable(childInstance)
            };
            childInstance.MIDGARDMVC_UI_CREATE_GUID = guid;
        });
    });

    midgardproject.SavePlugin.enablerButton.hide();
    midgardproject.SavePlugin.disablerButton.show();
};

midgardproject.SavePlugin.disableEditables = function() {
    jQuery.each(midgardproject.SavePlugin.objects, function(index, midgardObject) {
        jQuery.each(midgardObject.properties, function(index, editableObject) {
            editableObject.aloha.destroy();
        });
    });
    midgardproject.SavePlugin.objects = {};
    midgardproject.SavePlugin.disablerButton.hide();
    midgardproject.SavePlugin.enablerButton.show();
};

/**
 * collect data and save 
 */
midgardproject.SavePlugin.save = function () {

    // iterate all Midgard objects which have been made Aloha editable
    jQuery.each(midgardproject.SavePlugin.objects, function(index, midgardObject) {
        var guid = index;
        var schematype = midgardObject.type;
        var propertyContents = {
            type: schematype,
            identifier: guid,
        };
        var objectModified = false;
        jQuery.each(midgardObject.properties, function(index, editableObject) {
            if (editableObject.aloha.isModified())
            {
                propertyContents[index] = editableObject.aloha.getContents();
                objectModified = true;
            }
        });

        if (objectModified)
        {
            // Send the edited fields to the form handler backend
            var url = '/mgd:create/save/json';
            jQuery.ajax({
                url: url,
                dataType: 'json',
                data: propertyContents,
                type: 'POST',
                success: function (response) {
                    jQuery.each(midgardObject.properties, function(index, editableObject) {
                        editableObject.aloha.setUnmodified();
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
