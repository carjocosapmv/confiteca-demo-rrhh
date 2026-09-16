<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('request_type'); // vacation | remote_work
            $table->date('start_date');
            $table->date('end_date');
            $table->date('return_date')->nullable();
            $table->integer('days_requested')->default(0);
            $table->integer('days_charged')->default(0);
            $table->integer('weekend_days_included')->default(0);
            $table->boolean('uses_weekend_rule')->default(false);
            $table->text('notes')->nullable();
            $table->string('status')->default('pending'); // pending | approved | rejected
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('vacation_balances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('year')->default(2026);
            $table->integer('total_days')->default(0);
            $table->integer('used_days')->default(0);
            $table->integer('weekend_rule_uses')->default(0);
            $table->date('renewal_date')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'year']);
        });

        Schema::create('remote_work_balances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('total_days')->default(6);
            $table->integer('used_days')->default(0);
            $table->date('renewal_date')->nullable();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->boolean('read')->default(false);
            $table->string('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('user_relationships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('authorizer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('action');
            $table->string('entity_type');
            $table->string('entity_id')->nullable();
            $table->json('changes')->nullable();
            $table->foreignUuid('performed_by')->constrained('users')->cascadeOnDelete();
            $table->string('performed_by_email')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('created_at');
            $table->index('entity_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('user_relationships');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('remote_work_balances');
        Schema::dropIfExists('vacation_balances');
        Schema::dropIfExists('leave_requests');
    }
};
