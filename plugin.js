'use strict';

var mongoose = require('mongoose'),
    _ = require('lodash');

function validate(validator, fieldName, fieldPath, comparer, type, msg) {
    if (validator) {
        var value, path, message, newOnly;

        if (typeof validator === 'string') {
            path = validator;
        }
        else if (Array.isArray(validator)) {
            if (typeof validator[0] === 'string') {
                path = validator[0];
            }
            else {
                value = validator[0];
            }
            message = validator[1];
        }
        else if (_.isPlainObject(validator)) {
            value = validator.value;
            path = validator.path;
            message = validator.message;
            newOnly = validator.newOnly;
        }
        else {
            value = validator;
        }

        if (_.isFunction(value)) {
            value = value();
        }

        message = message || 'Field ' + fieldName + ' must be ' + msg + ' ' +
            (typeof value === 'undefined' ? path : value);

        fieldPath.validate(function (v) {
            var otherValue = typeof value === 'undefined' ?
                _.get(this, path) :
                value;

            return (newOnly && !this.isNew) ||
                typeof v === 'undefined' ||
                typeof otherValue === 'undefined' ||
                comparer(v, otherValue);
        }, message, type);
    }
}

/**
 * A Plugin for mongo to validate array min length
 * Use: noEdit: '[message]'
 * @param {Schema} schema
 * @param {Object} options
 */
function comparisonPlugin(schema, options) {
    schema.eachPath(function (fieldName, fieldPath) {
            var lt = fieldPath.options.lt;
            validate(lt, fieldName, fieldPath, function (value, otherValue) {
                return value < otherValue;
            }, 'lt', 'lower than');

            var lte = fieldPath.options.lte;
            validate(lte, fieldName, fieldPath, function (value, otherValue) {
                return value <= otherValue;
            }, 'lte', 'lower than or equal to');

            var gt = fieldPath.options.gt;
            validate(gt, fieldName, fieldPath, function (value, otherValue) {
                return value > otherValue;
            }, 'gt', 'greater than');

            var gte = fieldPath.options.gte;
            validate(gte, fieldName, fieldPath, function (value, otherValue) {
                return value >= otherValue;
            }, 'gte', 'greater than or equal to');

            var eq = fieldPath.options.eq;
            validate(eq, fieldName, fieldPath, function (value, otherValue) {
                return value === otherValue;
            }, 'eq', 'equal to');

            if (fieldPath.instance === 'Array' && fieldPath.schema) {
                comparisonPlugin(fieldPath.schema);
            }
        }
    );
}

mongoose.plugin(comparisonPlugin);