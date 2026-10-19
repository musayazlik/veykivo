using System.Net;
using Microsoft.AspNetCore.HttpOverrides;

namespace Veykivo.Api.Infrastructure;

public static class TrustedProxyConfiguration
{
    public static void Configure(ForwardedHeadersOptions options, IConfiguration configuration)
    {
        var proxies = configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>() ?? [];
        var networks = configuration.GetSection("ForwardedHeaders:KnownNetworks").Get<string[]>() ?? [];
        options.KnownProxies.Clear();
        options.KnownIPNetworks.Clear();
        options.ForwardLimit = configuration.GetValue("ForwardedHeaders:ForwardLimit", 1);
        if (options.ForwardLimit is not > 0)
            throw new InvalidOperationException("ForwardedHeaders:ForwardLimit pozitif olmalı.");

        foreach (var proxy in proxies) options.KnownProxies.Add(IPAddress.Parse(proxy));
        foreach (var network in networks) options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(network));

        // Boş güven listesi hiçbir başlığın işlenmemesi demektir; tüm proxy'lere güvenmek değil.
        options.ForwardedHeaders = proxies.Length + networks.Length == 0
            ? ForwardedHeaders.None
            : ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    }
}
