# CI/CD - Pipeline AWS (CodePipeline + CodeBuild)

Pipeline : **Source (GitHub)** → **Deploy Dev** (tests + `serverless deploy --stage dev`) → **Approbation manuelle** → **Deploy Prod** (tests + `serverless deploy --stage prod`).

## 1. Créer la connexion GitHub (CodeStar Connection) — une seule fois

```bash
aws codestar-connections create-connection \
  --provider-type GitHub \
  --connection-name todolist-api-github \
  --region eu-west-3
```

Récupère le `ConnectionArn` retourné, puis va dans la console AWS :
**Developer Tools > Settings > Connections** → clique sur la connexion (statut `Pending`) → **Update pending connection** → autorise l'accès à GitHub (installation de l'app AWS Connector for GitHub sur `langston8182/todolist-api`). Le statut doit passer à `Available`.

> Cette étape manuelle (clic dans la console) est obligatoire : AWS ne peut pas authentifier GitHub en CLI pur.

## 2. Stocker les URI MongoDB dans SSM Parameter Store (SecureString)

```bash
aws ssm put-parameter \
  --name "/todolist-api/dev/MONGODB_URI" \
  --type SecureString \
  --value "mongodb+srv://user:pass@todolist-preprod.xxxxx.mongodb.net/?retryWrites=true&w=majority" \
  --region eu-west-3

aws ssm put-parameter \
  --name "/todolist-api/prod/MONGODB_URI" \
  --type SecureString \
  --value "mongodb+srv://user:pass@todolist-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority" \
  --region eu-west-3
```

## 3. Déployer le pipeline (CloudFormation)

```bash
aws cloudformation deploy \
  --template-file infra/pipeline.yml \
  --stack-name todolist-api-pipeline \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-3 \
  --parameter-overrides \
      CodeStarConnectionArn=<ARN_DE_LA_CONNEXION> \
      GitHubOwner=langston8182 \
      GitHubRepo=todolist-api \
      GitHubBranch=main
```

## 4. Déclenchement

Chaque `git push` sur `main` déclenche automatiquement : build + tests + déploiement `dev`. Le pipeline s'arrête ensuite sur l'étape d'approbation manuelle (visible dans la console CodePipeline) avant de déployer en `prod`.

## Fichiers

- `infra/pipeline.yml` — Stack CloudFormation (CodePipeline, CodeBuild, rôles IAM, bucket d'artefacts).
- `infra/buildspec-dev.yml` — Build + tests (unit + intégration) + `serverless deploy --stage dev`.
- `infra/buildspec-prod.yml` — Build + tests unitaires + `serverless deploy --stage prod`.

## Mise à jour du pipeline

Si tu modifies `infra/pipeline.yml`, relance la commande `aws cloudformation deploy` de l'étape 3 pour appliquer les changements (pas besoin de recréer la stack).
