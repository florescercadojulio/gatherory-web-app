CREATE INDEX "blueprint_discovery_exposure_issued_idx" ON "blueprint_discovery_exposure" ("issued_at");--> statement-breakpoint
CREATE INDEX "blueprint_discovery_exposure_actor_issued_idx" ON "blueprint_discovery_exposure" ("actor_user_id","issued_at");--> statement-breakpoint
CREATE INDEX "blueprint_discovery_signal_created_idx" ON "blueprint_discovery_signal" ("created_at");--> statement-breakpoint
CREATE INDEX "blueprint_preference_mutation_kind_created_idx" ON "blueprint_preference_mutation" ("kind","created_at");