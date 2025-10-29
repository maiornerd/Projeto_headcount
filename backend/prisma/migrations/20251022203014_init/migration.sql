-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "data_admissao" TIMESTAMP(3) NOT NULL,
    "funcao_codigo" TEXT NOT NULL,
    "funcao_desc" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "jornada" INTEGER NOT NULL,
    "salario_hora" DECIMAL(65,30),
    "salario_atual" DECIMAL(65,30) NOT NULL,
    "escolaridade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Headcount" (
    "id" TEXT NOT NULL,
    "colig" TEXT NOT NULL,
    "cod_colig" TEXT NOT NULL,
    "empresa_hc" TEXT NOT NULL,
    "cod_sec_hc" TEXT NOT NULL,
    "cod_sec" TEXT NOT NULL,
    "gestor_area_hc" TEXT NOT NULL,
    "atividade_hc" TEXT NOT NULL,
    "desc_sec_hc" TEXT NOT NULL,
    "desc_area_rm" TEXT NOT NULL,
    "macro_area" TEXT NOT NULL,
    "cod_funcao" TEXT NOT NULL,
    "desc_funcao" TEXT NOT NULL,
    "qtd_orc_historico" JSONB NOT NULL,

    CONSTRAINT "Headcount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "cod_funcao" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo_html" TEXT,
    "arquivo_url" TEXT,
    "publicado_por" TEXT,
    "publicado_em" TIMESTAMP(3),

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "changes_summary" JSONB,
    "backup_reference" TEXT,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_table" TEXT,
    "target_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_matricula_key" ON "User"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_matricula_idx" ON "User"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_matricula_key" ON "Employee"("matricula");

-- CreateIndex
CREATE INDEX "Employee_matricula_idx" ON "Employee"("matricula");

-- CreateIndex
CREATE INDEX "Employee_funcao_codigo_idx" ON "Employee"("funcao_codigo");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "Headcount_cod_colig_idx" ON "Headcount"("cod_colig");

-- CreateIndex
CREATE INDEX "Headcount_cod_funcao_idx" ON "Headcount"("cod_funcao");

-- CreateIndex
CREATE INDEX "Headcount_macro_area_idx" ON "Headcount"("macro_area");

-- CreateIndex
CREATE UNIQUE INDEX "JobDescription_cod_funcao_key" ON "JobDescription"("cod_funcao");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
