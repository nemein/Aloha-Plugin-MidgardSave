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
midgardproject.SavePlugin.languages = ['en','fi'];

/**
 * Holder for Midgard objects (array indexed by GUID) that have been made editable on the page
 */
midgardproject.SavePlugin.objects = [];

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
        
    // add buttons to ribbon
    GENTICS.Aloha.Ribbon.addButton(midgardproject.SavePlugin.enablerButton);
    GENTICS.Aloha.Ribbon.addButton(midgardproject.SavePlugin.disablerButton);
    GENTICS.Aloha.Ribbon.addButton(saveButton);
};

midgardproject.SavePlugin.enableEditable = function(objectContainer) {

    var editableObject = {};
    editableObject.identifier = objectContainer.attr('about');
    editableObject.type = objectContainer.attr('typeof');

    // Seek editable properties
    editableObject.properties = {};
    var objectProperties = jQuery('*', objectContainer).filter(function() {
        return jQuery(this).attr('property'); 
    });
    jQuery.each(objectProperties, function(index, objectProperty)
    {
        var objectProperty = jQuery(objectProperty);
        var propertyName = objectProperty.attr('property');
        editableObject.properties[propertyName] = {
            
            element: objectProperty,
            aloha: new GENTICS.Aloha.Editable(objectProperty)
        };
    });

    midgardproject.SavePlugin.objects[midgardproject.SavePlugin.objects.length] = editableObject;
};

midgardproject.SavePlugin.enableEditables = function() {
    var objectContainers = jQuery('[typeof]');
    jQuery.each(objectContainers, function(index, objectContainer)
    {
        var objectContainer = jQuery(objectContainer);
        if (typeof objectContainer.attr('about') == 'undefined') {
            // No identifier set, therefore not editable
            return true;
        }
        midgardproject.SavePlugin.enableEditable(objectContainer);
    });
};

midgardproject.SavePlugin.disableEditables = function() {
    jQuery.each(midgardproject.SavePlugin.objects, function(index, editableObject) {
        jQuery.each(editableObject.properties, function(propertyName, editableProperty) {
            editableProperty.element.mahalo();
        });
    });
    midgardproject.SavePlugin.objects = [];
};

/**
 * collect data and save 
 */
midgardproject.SavePlugin.save = function () {

    // iterate all Midgard objects which have been made Aloha editable
    jQuery.each(midgardproject.SavePlugin.objects, function(objectIndex, editableObject) {

        var saveObject = {
            type: editableObject.type,
            identifier: editableObject.identifier,
        };

        var objectModified = false;
        jQuery.each(editableObject.properties, function(index, editableProperty) {
            if (editableProperty.aloha.isModified())
            {
                saveObject[index] = editableProperty.aloha.getContents();
                objectModified = true;
            }
        });

        if (!objectModified)
        {
            return true;
        }

        // Send the edited fields to the form handler backend
        var url = '/mgd:create/save/json';
        jQuery.ajax({
            url: url,
            dataType: 'json',
            data: saveObject,
            type: 'POST',
            success: function (response) {
                jQuery.each(editableObject.properties, function(index, editableProperty) {
                    editableProperty.aloha.setUnmodified();
                });
                console.log(response);
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
    });
} ;
