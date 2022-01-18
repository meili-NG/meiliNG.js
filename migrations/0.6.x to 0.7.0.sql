/*
 * Renaming Authorization to Authentication
 *
 * See: https://github.com/meiling-gatekeeper/meiling/commit/cbe0e77b86c774d5e80835ed40262ef950b48f81#commitcomment-64032495
 */

ALTER TABLE `Authorization` RENAME TO `Authentication`;
