using StackExchange.Redis;

namespace FluxPay.Infrastructure.Redis;

public class RedisConnectionFactory
{
    private readonly Lazy<ConnectionMultiplexer>? _connection;
    private readonly IDatabase? _database;

    public RedisConnectionFactory(string connectionString)
    {
        var options = ConfigurationOptions.Parse(connectionString);
        
        _connection = new Lazy<ConnectionMultiplexer>(() => 
            ConnectionMultiplexer.Connect(options));
    }

    public RedisConnectionFactory(IDatabase database)
    {
        _database = database;
    }

    public virtual IDatabase GetDatabase()
    {
        return _database ?? _connection!.Value.GetDatabase();
    }

    public IConnectionMultiplexer GetConnection()
    {
        if (_connection == null)
        {
            throw new InvalidOperationException("Connection not available when using IDatabase constructor");
        }
        return _connection.Value;
    }
}
