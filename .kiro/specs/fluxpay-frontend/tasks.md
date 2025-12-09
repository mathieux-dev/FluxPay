# Implementation Plan

- [x] 1. Setup projeto Next.js e configuração base





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - Criar projeto Next.js 14+ com TypeScript
  - Configurar Tailwind CSS com tema Palmeiras
  - Instalar dependências (shadcn/ui, React Query, Axios, Zod)
  - Configurar ESLint, Prettier, Husky
  - Criar estrutura de pastas
  - _Requirements: 21.1, 21.2, 22.1_

- [x] 2. Implementar sistema de autenticação





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [x] 2.1 Criar API client com HMAC signing


    - Implementar HMACRequestSigner class
    - Implementar APIClient com interceptors
    - _Requirements: 32.1, 32.2, 32.3_
  
  - [x] 2.2 Criar auth store (Zustand)


    - Implementar AuthState com login/logout/refresh
    - Armazenar access token em memória
    - _Requirements: 31.1, 31.2_
  
  - [x] 2.3 Criar hooks de autenticação


    - useAuth hook com auto-refresh
    - useRequireAuth hook para proteção de rotas
    - _Requirements: 1.4, 31.3_
  
  - [x] 2.4 Criar páginas de login


    - Login merchant (email/password)
    - Login admin (email/password/MFA)
    - _Requirements: 1.1, 1.2, 13.1, 13.2_
  
  - [x] 2.5 Implementar middleware de autenticação


    - Verificar refresh token em cookies
    - Redirecionar para login se não autenticado
    - _Requirements: 1.3, 31.5_

- [x] 3. Criar componentes base do design system





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [x] 3.1 Configurar tema Palmeiras no Tailwind


    - Definir cores primárias (#006437, #008B4A)
    - Configurar dark mode
    - _Requirements: 21.1, 21.2, 21.3, 29.2, 29.3_
  
  - [x] 3.2 Instalar e configurar shadcn/ui


    - Button, Card, Input, Select, Table, Dialog
    - Aplicar cores do Palmeiras
    - _Requirements: 21.1_
  
  - [x] 3.3 Criar componentes de layout


    - Sidebar com navegação
    - Header com user menu
    - ModeIndicator (sandbox/production)
    - _Requirements: 22.1, 26.1, 26.3_

- [x] 4. Implementar dashboard merchant





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [x] 4.1 Criar página de dashboard


    - DashboardStats component (4 cards)
    - TransactionChart component (Recharts)
    - Recent transactions list
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 4.2 Implementar polling para real-time updates


    - Polling a cada 30 segundos
    - React Query com refetchInterval
    - _Requirements: 23.1, 23.3_

- [x] 5. Implementar gestão de transações





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**

  - [x] 5.1 Criar página de listagem

    - TransactionList component com tabela
    - Paginação (50 itens por página)
    - _Requirements: 3.1_
  
  - [x] 5.2 Implementar filtros e busca


    - TransactionFilters component
    - Filtros por status, método, data
    - Busca por ID ou email
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [x] 5.3 Criar página de detalhes da transação


    - Exibir informações completas
    - Timeline de eventos
    - Provider responses
    - Webhook delivery status
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.4 Implementar funcionalidade de refund


    - Botão "Refund" em transações pagas
    - Modal com form (full/partial)
    - Chamar API e atualizar status
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 5.5 Implementar exportação de dados


    - Botão "Export" na lista
    - Opções CSV, Excel, JSON
    - Download do arquivo
    - _Requirements: 25.1, 25.2, 25.3, 25.4_

- [x] 6. Implementar ambiente de sandbox





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**

  - [x] 6.1 Criar toggle sandbox/production

    - SandboxToggle component
    - Salvar preferência em localStorage
    - Banner de aviso em modo sandbox
    - _Requirements: 26.1, 26.2, 26.3_
  
  - [x] 6.2 Criar página de sandbox


    - PaymentForm component (card, PIX, boleto)
    - TestCredentials component
    - Exibir resultado do pagamento
    - _Requirements: 5.1, 5.5, 27.1, 27.2_
  
  - [x] 6.3 Implementar tokenização de cartão


    - CardTokenization component com iframe Pagar.me
    - Carregar SDK com SRI
    - Receber apenas token
    - _Requirements: 40.1, 40.2, 40.5_
  
  - [x] 6.4 Implementar pagamento PIX


    - Gerar QR code via Gerencianet sandbox
    - PIXQRCode component
    - Botão copiar código
    - _Requirements: 5.3, 27.2_
  
  - [x] 6.5 Implementar pagamento boleto


    - Gerar boleto via Gerencianet sandbox
    - Exibir barcode e PDF
    - _Requirements: 5.4, 27.2_

- [x] 7. Implementar gestão de webhooks





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [x] 7.1 Criar página de configuração


    - Form para webhook URL
    - Gerar webhook secret
    - Exibir secret apenas uma vez
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 7.2 Implementar webhook tester


    - WebhookTester component
    - Botão "Send Test Webhook"
    - Exibir request/response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 7.3 Exibir histórico de webhooks


    - Lista de deliveries recentes
    - Status e retry count
    - _Requirements: 8.4_
  
  - [x] 7.4 Exibir exemplos de código


    - Code examples em múltiplas linguagens
    - Signature verification
    - _Requirements: 8.5, 24.5_

- [x] 8. Implementar gestão de API keys






  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [x] 8.1 Criar página de API keys

    - Lista de keys ativas
    - Creation date e last used
    - Usage statistics
    - _Requirements: 7.1, 7.5_
  
  - [x] 8.2 Implementar criação de API key


    - Form de criação
    - Exibir secret apenas uma vez
    - Warning sobre não poder recuperar
    - _Requirements: 7.2, 32.5_
  
  - [x] 8.3 Implementar rotação de API key


    - Criar nova key
    - Marcar antiga para deprecação
    - Exibir ambas com expiration
    - _Requirements: 7.3_
  
  - [x] 8.4 Implementar revogação de API key


    - Botão "Revoke"
    - Confirmação
    - Desabilitar imediatamente
    - _Requirements: 7.4_

- [x] 9. Implementar gestão de payment links





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [x] 9.1 Criar página de payment links


    - Lista de links
    - Status (active, expired, paid)
    - Creation date e payment count
    - _Requirements: 9.3_
  
  - [x] 9.2 Implementar criação de payment link


    - Form (amount, description, expiration)
    - Gerar URL única e QR code
    - _Requirements: 9.1, 9.2_
  
  - [x] 9.3 Criar página de detalhes do link


    - Exibir informações
    - Botão copiar URL
    - Download QR code
    - _Requirements: 9.4_
  


  - [x] 9.4 Criar página pública de pagamento





    - Página /pay/[linkId]
    - Exibir amount e description
    - Payment methods (card, PIX, boleto)
    - Success page após pagamento
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10. Implementar gestão de assinaturas





  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [x] 10.1 Criar página de assinaturas


    - Lista de subscriptions
    - Status, customer, amount, next billing
    - _Requirements: 12.1_
  

  - [x] 10.2 Implementar criação de assinatura

    - Form (customer, amount, interval, card token)
    - Chamar API backend
    - Exibir subscription ID
    - _Requirements: 12.2, 12.3_
  

  - [x] 10.3 Criar página de detalhes da assinatura

    - Exibir informações completas
    - Lista de charges
    - _Requirements: 12.4_
  


  - [x] 10.4 Implementar cancelamento
    - Botão "Cancel"
    - Confirmação
    - Atualizar status
    - _Requirements: 12.5_

- [ ] 11. Implementar documentação de API
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 11.1 Criar página de API docs
    - Interactive documentation
    - Todos os endpoints
    - _Requirements: 24.1_
  
  - [ ] 11.2 Adicionar code examples
    - JavaScript, Python, PHP, C#
    - HMAC signature generation
    - Usar API key real do merchant
    - _Requirements: 24.2, 24.3_
  
  - [ ] 11.3 Implementar "Try it" feature
    - Testar API calls do browser
    - _Requirements: 24.4_

- [ ] 12. Implementar dashboard admin
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 12.1 Criar página de merchants
    - MerchantList component
    - Search e filtros
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [ ] 12.2 Criar página de detalhes do merchant
    - Exibir informações completas
    - Transaction statistics
    - Recent activity
    - _Requirements: 14.4, 14.5_
  
  - [ ] 12.3 Implementar criação de merchant
    - MerchantForm component
    - Gerar API keys
    - Exibir credentials
    - _Requirements: 15.1, 15.2, 15.4_
  
  - [ ] 12.4 Implementar configuração de providers
    - Form para Pagar.me e Gerencianet
    - Encriptar credentials antes de enviar
    - Toggle sandbox mode
    - Exibir credentials mascaradas
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 12.5 Implementar enable/disable merchant
    - Toggle no merchant details
    - Confirmação
    - Warning sobre rejeição de requests
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 13. Implementar analytics admin
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 13.1 Criar página de analytics
    - Stats cards (merchants, transactions, volume, success rate)
    - Transaction volume chart
    - Provider performance metrics
    - Top merchants by volume
    - Error rate trends
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 14. Implementar reconciliação admin
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 14.1 Criar página de reconciliação
    - Lista de daily reports
    - Date e status
    - _Requirements: 19.1_
  
  - [ ] 14.2 Criar página de detalhes do report
    - Matched transactions
    - Mismatches
    - Missing transactions
    - FluxPay vs Provider status
    - _Requirements: 19.2, 19.3_
  
  - [ ] 14.3 Implementar resolução de mismatches
    - Botão "Mark as Resolved"
    - Log da ação
    - _Requirements: 19.4_

- [ ] 15. Implementar audit logs admin
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 15.1 Criar página de audit logs
    - Lista de entries
    - Timestamp, actor, action, resource
    - _Requirements: 20.1_
  
  - [ ] 15.2 Implementar filtros
    - Date range
    - Actor
    - Action type
    - _Requirements: 20.2, 20.3, 20.4_
  
  - [ ] 15.3 Criar página de detalhes do log
    - Full payload
    - Signature verification status
    - _Requirements: 20.5_

- [ ] 16. Implementar segurança
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 16.1 Configurar CSP headers
    - Restrict script sources
    - Block inline scripts
    - Restrict frame ancestors
    - _Requirements: 33.1, 33.2, 33.3, 33.4_
  
  - [ ] 16.2 Implementar input sanitization
    - Sanitize HTML
    - Escape special characters
    - Validate URLs
    - _Requirements: 34.1, 34.2, 34.3, 34.4_
  
  - [ ] 16.3 Implementar form validation
    - Zod schemas
    - Amount validation
    - Email validation (RFC 5322)
    - URL validation
    - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5_
  
  - [ ] 16.4 Implementar rate limiting client-side
    - Lock login após 5 falhas
    - Countdown timer
    - Throttle API requests
    - _Requirements: 36.1, 36.2, 36.3_
  
  - [ ] 16.5 Implementar CSRF protection
    - Request CSRF token
    - Include em state-changing requests
    - Auto-refresh token expirado
    - _Requirements: 37.1, 37.2, 37.3, 37.4_
  
  - [ ] 16.6 Implementar SRI
    - Integrity hashes em CDN scripts
    - Integrity hashes em stylesheets
    - Refuse load se falhar
    - _Requirements: 38.1, 38.2, 38.3_
  
  - [ ] 16.7 Implementar secure session management
    - Session ID em httpOnly cookie
    - Re-auth se IP mudar
    - Expire após 15min inatividade
    - Sync logout entre tabs
    - _Requirements: 39.1, 39.2, 39.3, 39.4, 39.5_
  
  - [ ] 16.8 Implementar secure error handling
    - User-friendly messages
    - Log full errors to monitoring
    - Generic auth errors
    - Sanitize provider errors
    - Redact sensitive data em logs
    - _Requirements: 41.1, 41.2, 41.3, 41.4, 41.5_
  
  - [ ] 16.9 Implementar secure env variables
    - NEXT_PUBLIC_ apenas para non-sensitive
    - Fetch secrets do backend
    - Never expose em console
    - .env em .gitignore
    - _Requirements: 43.1, 43.2, 43.3, 43.4, 43.5_
  
  - [ ] 16.10 Implementar audit logging
    - Log login events
    - Log sensitive actions
    - Log auth failures
    - Log suspicious activity
    - Include trace IDs
    - _Requirements: 44.1, 44.2, 44.3, 44.4, 44.5_

- [ ] 17. Implementar responsividade
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 17.1 Desktop layout (>1024px)
    - Full sidebar
    - Multi-column layouts
    - _Requirements: 22.1_
  
  - [ ] 17.2 Tablet layout (768px-1024px)
    - Collapsible sidebar
    - Adjusted layouts
    - _Requirements: 22.2_
  
  - [ ] 17.3 Mobile layout (<768px)
    - Hamburger menu
    - Single-column layouts
    - Card layouts para tables
    - _Requirements: 22.3, 22.5_
  
  - [ ] 17.4 Orientation handling
    - Adapt ao rotation
    - _Requirements: 22.4_

- [ ] 18. Implementar dark mode
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 18.1 Detectar system preference
    - _Requirements: 29.1_
  
  - [ ] 18.2 Toggle dark mode
    - Dark theme com Palmeiras green accents
    - Dark gray background
    - _Requirements: 29.2, 29.3_
  
  - [ ] 18.3 Salvar preferência
    - localStorage
    - _Requirements: 29.5_

- [ ] 19. Implementar error handling
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 19.1 Criar error boundaries
    - Catch React errors
    - Display fallback UI
    - _Requirements: 28.1_
  
  - [ ] 19.2 Implementar toast notifications
    - Success, error, warning, info
    - Palmeiras colors
    - _Requirements: 28.1, 28.2_
  
  - [ ] 19.3 Implementar error states
    - Network errors com retry
    - API errors com error codes
    - Validation errors inline
    - _Requirements: 28.2, 28.3, 28.4, 28.5_

- [ ] 20. Implementar monitoring
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 20.1 Integrar Sentry
    - Error tracking
    - Redact sensitive data
    - _Requirements: 41.2_
  
  - [ ] 20.2 Integrar Vercel Analytics
    - Page views
    - User interactions
    - _Requirements: N/A_

- [ ] 21. Testes e deployment
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - [ ] 21.1 Escrever unit tests
    - HMAC signer
    - Utility functions
    - React hooks
    - _Requirements: N/A_
  
  - [ ] 21.2 Escrever integration tests
    - Login flow
    - Payment creation
    - Transaction filtering
    - _Requirements: N/A_
  
  - [ ] 21.3 Escrever E2E tests
    - Critical user journeys
    - Cross-browser
    - Mobile responsiveness
    - _Requirements: N/A_
  
  - [ ] 21.4 Configurar CI/CD
    - GitHub Actions
    - Lint, type-check, test
    - Deploy to Vercel/Render
    - _Requirements: 42.1, 42.2_
  
  - [ ] 21.5 Configurar dependency scanning
    - npm audit
    - Fail build em high-severity
    - _Requirements: 42.1, 42.2, 42.3_

- [ ] 22. Checkpoint final
  - **IMPORTANT: Código MÍNIMO. Sem comentários excessivos, sem docs desnecessários, sem scripts extras. Apenas o essencial.**
  - Testar fluxo completo merchant
  - Testar fluxo completo admin
  - Testar em sandbox Pagar.me e Gerencianet
  - Verificar responsividade
  - Verificar dark mode
  - Verificar segurança (CSP, XSS, CSRF)
  - Ensure all tests pass, ask the user if questions arise.

