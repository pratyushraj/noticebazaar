creator-contracts:1 Error while trying to use the following icon from the Manifest: https://creatorarmour.com/icon-192x192.png (Download error or resource isn't a valid image)# Migrations checklist – all migrations

Use this list to confirm every migration is applied to your Supabase project.

**How to apply:** From project root run:
```bash
supabase db push
```
Or link your project first: `supabase link --project-ref YOUR_REF` then `supabase db push`.

**How to verify:** Run `supabase migration list` — applied migrations show a timestamp in the **Remote** column. If Remote is empty for all rows, no migrations have been applied to the linked remote yet.

---

## Checklist (apply order)

- [ ] `20240101000000_add_onboarding_complete_to_profiles.sql`
- [ ] `20251219212332_enable_realtime_messages.sql`
- [ ] `20251219220000_enable_realtime_conversation_participants.sql`
- [ ] `20251219230000_auto_add_default_lawyer_to_conversations.sql`
- [ ] `20251219230001_update_create_conversation_add_default_lawyer.sql`
- [ ] `20251219230002_backfill_default_lawyer_to_existing_conversations.sql`
- [ ] `20251220000000_create_get_user_emails_rpc.sql`
- [ ] `20251220000001_create_consumer_complaints_table.sql`
- [ ] `20251220000002_create_complaint_proofs_bucket.sql`
- [ ] `20251220000003_extend_notifications_for_consumer_complaints.sql`
- [ ] `20251220000004_add_severity_to_consumer_complaints.sql`
- [ ] `20251221_add_accepted_verified_to_brand_response_status.sql`
- [ ] `20251221_add_accepted_verified_to_brand_response_status_v2.sql`
- [ ] `20251221_ensure_otp_attempts_column.sql`
- [ ] `2025_01_15_create_issues_and_action_logs.sql`
- [ ] `2025_01_27_backend_ultra_polish.sql`
- [ ] `2025_01_27_ultra_polish_down.sql`
- [ ] `2025_01_28_create_conversation_function.sql`
- [ ] `2025_01_28_create_get_conversations_rpc.sql`
- [ ] `2025_01_28_fix_activity_log_rls.sql`
- [ ] `2025_01_28_fix_activity_log_rls_v2.sql`
- [ ] `2025_01_28_fix_conversation_participants.sql`
- [ ] `2025_01_28_fix_conversations_insert_policy.sql`
- [ ] `2025_01_28_fix_conversations_insert_policy_v2.sql`
- [ ] `2025_01_28_fix_conversations_insert_policy_v3_final.sql`
- [ ] `2025_01_28_fix_conversations_rls_final.sql`
- [ ] `2025_01_28_fix_conversations_rls_policy.sql`
- [ ] `2025_01_28_fix_conversations_rls_with_profile_check.sql`
- [ ] `2025_01_28_fix_participants_rls_recursion.sql`
- [ ] `2025_01_28_make_contract_ready_tokens_support_submissions.sql`
- [ ] `2025_01_28_messaging_system.sql`
- [ ] `2025_01_28_messaging_system_safe.sql`
- [ ] `2025_01_28_protection_reports.sql`
- [ ] `2025_01_28_verify_conversations_policies.sql`
- [ ] `2025_01_28_verify_policies.sql`
- [ ] `2025_01_29_add_brand_response_tracking.sql`
- [ ] `2025_01_29_create_influencers_table.sql`
- [ ] `2025_01_30_add_auto_save_fields_to_brand_deals.sql`
- [ ] `2025_01_30_add_last_reminded_at_to_brand_deals.sql`
- [ ] `2025_01_31_add_ai_analysis_fields_to_protection_reports.sql`
- [ ] `2025_01_31_add_brand_address_to_brand_deals.sql`
- [ ] `2025_01_31_add_brand_phone_to_brand_deals.sql`
- [ ] `2025_01_31_add_brand_team_name_to_brand_deals.sql`
- [ ] `2025_01_31_add_esign_fields_to_brand_deals.sql`
- [ ] `2025_01_31_add_invoice_url_to_brand_deals.sql`
- [ ] `2025_01_31_add_user_id_to_protection_reports.sql`
- [ ] `2025_01_XX_create_analytics_table.sql`
- [ ] `2025_02_01_add_decision_version_to_audit_log.sql`
- [ ] `2025_02_01_create_brand_reply_audit_log.sql`
- [ ] `2025_02_01_create_brand_reply_tokens.sql`
- [ ] `2025_02_15_add_signed_contract_fields_to_brand_deals.sql`
- [ ] `2025_02_16_create_deal_details_tokens.sql`
- [ ] `2025_02_17_add_safe_contract_fields.sql`
- [ ] `2025_02_17_add_signing_metadata.sql`
- [ ] `2025_02_18_create_gst_company_cache.sql`
- [ ] `2025_11_07_add_creator_id_to_brand_deals.sql`
- [ ] `2025_11_07_create_brand_deals_table.sql`
- [ ] `2025_11_07_refresh_profiles_schema.sql`
- [ ] `2025_11_08_add_pan_to_profiles.sql`
- [ ] `2025_11_08_create_creator_features_tables.sql`
- [ ] `2025_11_08_create_creators_and_social_accounts_tables.sql`
- [ ] `2025_11_09_create_copyright_scanner_tables.sql`
- [ ] `2025_11_10_create_tax_tables.sql`
- [ ] `2025_11_11_add_payment_fields_to_brand_deals.sql`
- [ ] `2025_11_12_create_social_accounts_table.sql`
- [ ] `2025_11_12_ensure_contract_file_url_exists.sql`
- [ ] `2025_11_13_enable_rls_for_brand_deals.sql`
- [ ] `2025_11_14_create_payment_reminders_table.sql`
- [ ] `2025_11_15_update_social_accounts_table.sql`
- [ ] `2025_11_20_add_trial_fields_to_profiles.sql`
- [ ] `2025_11_21_add_creator_profile_fields.sql`
- [ ] `2025_11_22_create_partner_functions.sql`
- [ ] `2025_11_22_create_partner_program_tables.sql`
- [ ] `2025_11_22_partner_program_complete.sql`
- [ ] `2025_11_23_partner_program_enhancements.sql`
- [ ] `2025_11_24_create_passkeys_table.sql`
- [ ] `2025_11_26_add_profile_fields.sql`
- [ ] `2025_11_27_auto_create_creator_profile.sql`
- [ ] `2025_11_28_create_notifications_system.sql`
- [ ] `2025_11_30_add_apply_url_to_opportunities.sql`
- [ ] `2025_11_30_add_brand_analytics.sql`
- [ ] `2025_11_30_add_brand_refresh_functions.sql`
- [ ] `2025_11_30_create_brand_bookmarks_table.sql`
- [ ] `2025_11_30_create_brand_reviews_table.sql`
- [ ] `2025_11_30_create_brands_table.sql`
- [ ] `2025_11_30_create_expenses_table.sql`
- [ ] `2025_11_30_create_opportunities_table.sql`
- [ ] `2025_11_30_seed_initial_brands.sql`
- [ ] `2025_12_01_create_brand_messages_table.sql`
- [ ] `2025_12_01_create_contract_issues_table.sql`
- [ ] `2025_12_01_create_creator_assets_bucket.sql`
- [ ] `2025_12_01_create_lawyer_requests_table.sql`
- [ ] `2025_12_01_fix_organization_id_not_null.sql`
- [ ] `2025_12_01_make_organization_id_nullable_in_brand_deals.sql`
- [ ] `2025_12_02_add_invoice_number_to_brand_deals.sql`
- [ ] `2025_12_02_add_progress_percentage_to_brand_deals.sql`
- [ ] `2025_12_02_add_proof_of_payment_url_to_brand_deals.sql`
- [ ] `2025_12_02_add_updated_at_to_brand_deals.sql`
- [ ] `2025_12_02_fix_rls_security_audit.sql`
- [ ] `2025_12_02_migrate_deal_progress_stages.sql`
- [ ] `2025_12_12_add_esign_invitation_id_to_brand_deals.sql`
- [ ] `2025_12_12_replace_esign_with_otp.sql`
- [ ] `2025_12_22_create_contract_ready_tokens.sql`
- [ ] `2025_12_22_create_contract_signatures.sql`
- [ ] `20260110145713_add_creator_otp_fields.sql`
- [ ] `2026_01_08_add_used_at_to_deal_details_tokens.sql`
- [ ] `2026_01_15_create_collab_requests.sql`
- [ ] `2026_01_16_create_collab_link_analytics.sql`
- [ ] `2026_01_17_add_instagram_handle_to_profiles.sql`
- [ ] `2026_01_17_ensure_username_column_exists.sql`
- [ ] `2026_01_17_ensure_username_not_from_instagram.sql`
- [ ] `2026_01_17_fix_collab_link_events_rls.sql`
- [ ] `2026_01_17_fix_partner_stats_rls.sql`
- [ ] `2026_01_27_add_barter_product_image_url.sql`
- [ ] `2026_01_28_add_delivery_fields_to_brand_deals.sql`
- [ ] `2026_01_29_add_brand_address_to_collab_requests.sql`
- [ ] `2026_01_29_add_shipping_fields_and_tokens.sql`
- [ ] `2026_01_30_add_creator_agency_fields_to_profiles.sql`
- [ ] `2026_01_30_create_brand_contacts_for_agency.sql`

---

**Total: 119 migrations**

After running `supabase db push`, you can tick the boxes above or rely on `supabase migration list` (Remote column filled = applied).
