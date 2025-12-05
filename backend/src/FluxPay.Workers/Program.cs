using FluxPay.Infrastructure;
using FluxPay.Workers;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHostedService<ReconciliationWorker>();
builder.Services.AddHostedService<WebhookRetryWorker>();

var host = builder.Build();
host.Run();
