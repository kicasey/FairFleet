using Microsoft.EntityFrameworkCore;
using FairFleetAPI.Models;

namespace FairFleetAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<User> Users => Set<User>();
    public DbSet<AirlineLoyaltyStatus> AirlineLoyaltyStatuses => Set<AirlineLoyaltyStatus>();
    public DbSet<SavedFlight> SavedFlights => Set<SavedFlight>();
    public DbSet<PriceHistory> PriceHistories => Set<PriceHistory>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<FolderCollaborator> FolderCollaborators => Set<FolderCollaborator>();
    public DbSet<Friendship> Friendships => Set<Friendship>();
    public DbSet<FlightFeedItem> FlightFeedItems => Set<FlightFeedItem>();
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<AirlineFareClassMap> AirlineFareClassMaps => Set<AirlineFareClassMap>();
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        builder.Entity<User>()
            .HasIndex(u => u.ClerkUserId)
            .IsUnique();
        
        builder.Entity<Friendship>()
            .HasOne(f => f.Requester)
            .WithMany()
            .HasForeignKey(f => f.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.Entity<Friendship>()
            .HasOne(f => f.Addressee)
            .WithMany()
            .HasForeignKey(f => f.AddresseeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
